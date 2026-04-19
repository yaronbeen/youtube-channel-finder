import { NextRequest } from "next/server";
import { searchVideos, scrapeChannels } from "../../../lib/bright-data";
import { extractEmails } from "../../../lib/email-extractor";
import { findEmailsFromPublicLinks } from "../../../lib/website-email";
import { checkRateLimit } from "../../../lib/rate-limit";
import type { VideoResult, ChannelResult, Channel, SseEvent } from "../../../lib/types";

export const maxDuration = 300; // Vercel serverless max

export async function POST(request: NextRequest) {
  // ── Parse input ──
  let keywords: string[];
  let numPosts = 20;
  try {
    const body = await request.json();
    keywords = (body.keywords as string)
      .split(",")
      .map((k: string) => k.trim())
      .filter(Boolean);

    const requestedNumPosts = Number(body.numPosts);
    if (Number.isFinite(requestedNumPosts) && requestedNumPosts > 0) {
      numPosts = Math.max(5, Math.min(60, Math.floor(requestedNumPosts)));
    }
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (keywords.length === 0) {
    return new Response(JSON.stringify({ error: "No keywords provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (keywords.length > 10) {
    return new Response(JSON.stringify({ error: "Maximum 10 keywords allowed" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── Rate limiting ──
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (process.env.NODE_ENV === "production") {
    const rateCheck = checkRateLimit(ip);
    if (!rateCheck.allowed) {
      const hoursLeft = Math.ceil(rateCheck.retryAfterMs / (1000 * 60 * 60));
      return new Response(
        JSON.stringify({
          error: `Rate limit exceeded. Try again in ${hoursLeft} hour(s).`,
        }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  // ── SSE stream ──
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: SseEvent) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          // controller may be closed
        }
      };

      void (async () => {
        try {
          // ── Step 1: Search videos ──
          send({
            type: "status",
            message: `Searching YouTube for ${keywords.length} keyword(s)...`,
            progress: 0.05,
          });

          const videoResults = await searchVideos(
            keywords.map((k) => ({ keyword: k, numPosts })),
            (msg) => send({ type: "status", message: msg, progress: 0.15 })
          );

          send({
            type: "status",
            message: `Found ${videoResults.length} video(s)`,
            progress: 0.3,
          });

          // ── Step 2: Deduplicate channels ──
          const channelsMap = new Map<
            string,
            {
              name: string;
              subscribers: string;
              keywords: Set<string>;
              videoEmails: Set<string>;
            }
          >();

          for (const video of videoResults) {
            const channelUrl = video.channel_url;
            if (!channelUrl) continue;

            const keyword = extractKeywordFromVideo(video);
            const videoEmails = extractEmails(video.description);
            const existing = channelsMap.get(channelUrl);

            if (existing) {
              if (keyword) existing.keywords.add(keyword);
              for (const email of videoEmails) {
                existing.videoEmails.add(email);
              }
            } else {
              channelsMap.set(channelUrl, {
                name: video.channel_name || "Unknown",
                subscribers: String(video.subscribers || ""),
                keywords: new Set(keyword ? [keyword] : []),
                videoEmails: new Set(videoEmails),
              });
            }
          }

          const uniqueChannelUrls = [...channelsMap.keys()];

          send({
            type: "status",
            message: `Discovered ${uniqueChannelUrls.length} unique channel(s)`,
            progress: 0.4,
          });

          send({ type: "channels", count: uniqueChannelUrls.length });

          if (uniqueChannelUrls.length === 0) {
            send({
              type: "result",
              channels: [],
            });
            send({ type: "done" });
            controller.close();
            return;
          }

          // ── Step 3: Scrape channel details ──
          send({
            type: "status",
            message: "Fetching channel details...",
            progress: 0.45,
          });

          const channelResults = await scrapeChannels(uniqueChannelUrls, (msg) =>
            send({ type: "status", message: msg, progress: 0.6 })
          );

          send({
            type: "status",
            message: "Processing channel data...",
            progress: 0.8,
          });

          // ── Step 4: Merge and extract emails ──
          const channels: Channel[] = [];

          for (const ch of channelResults) {
            const channelUrl = normalizeChannelUrl(ch);
            const mapEntry = channelsMap.get(channelUrl);

            const description = ch.description || ch.about || "";
            const linksText = formatLinks(ch.links);
            const allText = `${description} ${linksText}`;
            const emails = new Set<string>(extractEmails(allText));
            if (mapEntry) {
              for (const email of mapEntry.videoEmails) {
                emails.add(email);
              }
            }

            channels.push({
              channelUrl: channelUrl || ch.url || "",
              channelName: ch.name || ch.channel_name || mapEntry?.name || "Unknown",
              subscribers: String(
                ch.subscribers || mapEntry?.subscribers || ""
              ),
              description: truncate(description, 500),
              emails: [...emails],
              links: truncate(linksText, 500),
              keywords: mapEntry ? [...mapEntry.keywords] : [],
            });
          }

          // Also add channels we discovered but couldn't scrape
          for (const [url, entry] of channelsMap) {
            const alreadyIncluded = channels.some(
              (c) => c.channelUrl === url || c.channelUrl.includes(url.replace(/\/+$/, ""))
            );
            if (!alreadyIncluded) {
              channels.push({
                channelUrl: url,
                channelName: entry.name,
                subscribers: entry.subscribers,
                description: "",
                emails: [...entry.videoEmails],
                links: "",
                keywords: [...entry.keywords],
              });
            }
          }

          // ── Step 5: Simple second-pass email enrichment from channel links ──
          send({
            type: "status",
            message: "Running second-pass email scan on public links...",
            progress: 0.88,
          });

          let recoveredEmails = 0;
          for (const channel of channels) {
            if (channel.emails.length > 0 || !channel.links) continue;

            const extraEmails = await findEmailsFromPublicLinks(channel.links);
            if (extraEmails.length === 0) continue;

            channel.emails = [...new Set([...channel.emails, ...extraEmails])];
            recoveredEmails += extraEmails.length;
          }

          if (recoveredEmails > 0) {
            send({
              type: "status",
              message: `Recovered ${recoveredEmails} additional email(s) from public websites`,
              progress: 0.92,
            });
          }

          const emailCount = channels.reduce((sum, c) => sum + c.emails.length, 0);

          send({
            type: "status",
            message: `Extracted ${emailCount} email(s) from ${channels.length} channel(s)`,
            progress: 0.95,
          });

          send({ type: "result", channels });

          send({
            type: "status",
            message: `Done! Found ${channels.length} channels with ${emailCount} emails`,
            progress: 1.0,
          });

          send({ type: "done" });
        } catch (err) {
          let message = err instanceof Error ? err.message : "An unexpected error occurred";
          if (message.includes("Polling timed out")) {
            message =
              `${message}. Try fewer keywords and lower Depth (5 or 20) for hosted tests.` +
              ` For local testing, you can increase BD_POLL_TIMEOUT_MS in .env.local.`;
          }
          send({ type: "error", message });
        } finally {
          try {
            controller.close();
          } catch {
            // already closed
          }
        }
      })();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

// ── Helpers ──

function extractKeywordFromVideo(video: VideoResult): string {
  return (
    video.discovery_input?.keyword ||
    video.input?.keyword ||
    video.input?.discovery_input?.keyword ||
    ""
  );
}

function normalizeChannelUrl(ch: ChannelResult): string {
  const url = ch.input?.url || ch.url || "";
  return url.replace(/\/+$/, "").replace(/\/about$/, "");
}

function formatLinks(links: unknown): string {
  if (!links) return "";
  if (typeof links === "string") return links;
  if (Array.isArray(links)) {
    return links
      .map((link) => {
        if (typeof link === "string") return link;
        if (typeof link === "object" && link !== null) {
          return Object.values(link).join(" - ");
        }
        return String(link);
      })
      .join("; ");
  }
  return String(links);
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + "...";
}
