import { extractEmails } from "./email-extractor";

const URL_REGEX = /https?:\/\/[^\s"'<>]+/g;

/**
 * Simple second-pass email discovery from public links.
 * Keeps crawl small to avoid long request times.
 */
export async function findEmailsFromPublicLinks(
  linksText: string,
  maxUrls = 3
): Promise<string[]> {
  const seedUrls = extractUrls(linksText);
  const candidates = buildCandidateUrls(seedUrls).slice(0, maxUrls);
  const emails = new Set<string>();

  for (const url of candidates) {
    const html = await fetchText(url);
    if (!html) continue;

    for (const email of extractEmails(html)) {
      emails.add(email);
    }
  }

  return [...emails];
}

function extractUrls(text: string): string[] {
  if (!text) return [];

  const matches = text.match(URL_REGEX) || [];
  const cleaned = matches
    .map((url) => url.replace(/[),.;]+$/, ""))
    .filter((url) => {
      try {
        const parsed = new URL(url);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          return false;
        }
        if (parsed.hostname.includes("youtube.com") || parsed.hostname.includes("youtu.be")) {
          return false;
        }
        return true;
      } catch {
        return false;
      }
    });

  return [...new Set(cleaned)];
}

function buildCandidateUrls(urls: string[]): string[] {
  const candidates = new Set<string>();

  for (const url of urls) {
    candidates.add(url);

    try {
      const parsed = new URL(url);
      candidates.add(`${parsed.origin}/contact`);
      candidates.add(`${parsed.origin}/about`);
    } catch {
      // ignore invalid URL
    }
  }

  return [...candidates];
}

async function fetchText(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; YouTubeChannelFinder/1.0)",
      },
      signal: AbortSignal.timeout(8000),
      redirect: "follow",
    });

    if (!res.ok) return "";

    const contentType = (res.headers.get("content-type") || "").toLowerCase();
    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
      return "";
    }

    const body = await res.text();
    return body.slice(0, 300_000);
  } catch {
    return "";
  }
}
