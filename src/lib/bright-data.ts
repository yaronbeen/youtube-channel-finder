/**
 * Bright Data Datasets API wrapper (TypeScript port).
 *
 * Implements the trigger → poll → download pattern for:
 *   - YouTube Videos dataset  (gd_lk56epmy2i5g7lzu0k)
 *   - YouTube Channels dataset (gd_lk538t2k2p1k3oos71)
 */

import type {
  VideoSearchInput,
  ChannelScrapeInput,
  VideoResult,
  ChannelResult,
} from "./types";

// ── Constants ──

const BASE_URL = "https://api.brightdata.com/datasets/v3";
const VIDEOS_DATASET_ID = "gd_lk56epmy2i5g7lzu0k";
const CHANNELS_DATASET_ID = "gd_lk538t2k2p1k3oos71";
const POLL_INTERVAL_MS = 5_000; // 5 seconds
const POLL_TIMEOUT_MS = Number(process.env.BD_POLL_TIMEOUT_MS || 300_000); // default 5 minutes
const DOWNLOAD_RETRIES = 3;

function getApiKey(): string {
  const key = process.env.BRIGHT_DATA_API_KEY;
  if (!key) throw new Error("BRIGHT_DATA_API_KEY environment variable is not set");
  return key;
}

// ── Low-level API helpers ──

async function apiRequest<T = unknown>(
  method: "GET" | "POST",
  url: string,
  body?: unknown
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${getApiKey()}`,
    "Content-Type": "application/json",
  };

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(180_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Bright Data API ${res.status}: ${text}`);
  }

  const text = await res.text();
  if (!text) return null as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
}

// ── Trigger a dataset collection ──

export async function triggerCollection(
  datasetId: string,
  inputs: (VideoSearchInput | ChannelScrapeInput)[],
  discoverBy?: string
): Promise<string> {
  let url = `${BASE_URL}/trigger?dataset_id=${datasetId}&notify=false&include_errors=true`;
  if (discoverBy) {
    url += `&type=discover_new&discover_by=${discoverBy}`;
  }

  const response = await apiRequest<{ snapshot_id: string } | string>("POST", url, inputs);

  if (typeof response === "string") return response;
  if (response && typeof response === "object" && "snapshot_id" in response) {
    return response.snapshot_id;
  }

  throw new Error(`Unexpected trigger response: ${JSON.stringify(response)}`);
}

// ── Poll until snapshot is ready ──

export async function pollUntilReady(
  snapshotId: string,
  onProgress?: (status: string, elapsedMs: number) => void
): Promise<void> {
  const start = Date.now();

  while (true) {
    const elapsed = Date.now() - start;

    const progress = await apiRequest<{ status: string }>(
      "GET",
      `${BASE_URL}/progress/${snapshotId}`
    );

    const status = progress?.status ?? "unknown";
    onProgress?.(status, elapsed);

    if (status === "ready") {
      await sleep(3000); // grace period
      return;
    }

    if (["failed", "error", "cancelled"].includes(status)) {
      throw new Error(`Collection ${status}: ${JSON.stringify(progress)}`);
    }

    if (elapsed > POLL_TIMEOUT_MS) {
      throw new Error(`Polling timed out after ${Math.round(elapsed / 1000)}s`);
    }

    const remainingMs = Math.max(0, POLL_TIMEOUT_MS - elapsed);
    await sleep(Math.min(POLL_INTERVAL_MS, remainingMs));
  }
}

// ── Download snapshot results ──

export async function downloadSnapshot<T = unknown>(snapshotId: string): Promise<T[]> {
  for (let attempt = 1; attempt <= DOWNLOAD_RETRIES; attempt++) {
    const data = await apiRequest<T[] | { snapshot_id: string }>(
      "GET",
      `${BASE_URL}/snapshot/${snapshotId}?format=json`
    );

    // Sometimes the API returns {snapshot_id: ...} when not ready yet
    if (data && typeof data === "object" && !Array.isArray(data) && "snapshot_id" in data) {
      if (attempt < DOWNLOAD_RETRIES) {
        await sleep(10_000 + Math.random() * 5000);
        continue;
      }
    }

    if (Array.isArray(data)) return data;
    return [];
  }

  return [];
}

// ── High-level: search videos by keywords ──

export async function searchVideos(
  keywords: { keyword: string; numPosts: number }[],
  onProgress?: (message: string) => void
): Promise<VideoResult[]> {
  const inputs: VideoSearchInput[] = keywords.map((k) => ({
    keyword: k.keyword,
    num_of_posts: k.numPosts,
    start_date: "",
    end_date: "",
    country: "",
  }));

  onProgress?.(`Triggering video search for ${keywords.length} keyword(s)...`);
  const snapshotId = await triggerCollection(VIDEOS_DATASET_ID, inputs, "keyword");

  onProgress?.("Waiting for video results...");
  await pollUntilReady(snapshotId, (status, elapsed) => {
    const secs = Math.round(elapsed / 1000);
    onProgress?.(`Video search status: ${status} (${secs}s)`);
  });

  onProgress?.("Downloading video results...");
  const results = await downloadSnapshot<VideoResult>(snapshotId);
  onProgress?.(`Downloaded ${results.length} video(s)`);

  return results;
}

// ── High-level: scrape channel details ──

export async function scrapeChannels(
  channelUrls: string[],
  onProgress?: (message: string) => void
): Promise<ChannelResult[]> {
  const inputs: ChannelScrapeInput[] = channelUrls.map((url) => {
    const aboutUrl = url.replace(/\/+$/, "");
    return { url: aboutUrl.endsWith("/about") ? aboutUrl : `${aboutUrl}/about` };
  });

  onProgress?.(`Triggering channel scrape for ${channelUrls.length} channel(s)...`);
  const snapshotId = await triggerCollection(CHANNELS_DATASET_ID, inputs);

  onProgress?.("Waiting for channel data...");
  await pollUntilReady(snapshotId, (status, elapsed) => {
    const secs = Math.round(elapsed / 1000);
    onProgress?.(`Channel scrape status: ${status} (${secs}s)`);
  });

  onProgress?.("Downloading channel data...");
  const results = await downloadSnapshot<ChannelResult>(snapshotId);
  onProgress?.(`Downloaded ${results.length} channel(s)`);

  return results;
}

// ── Helpers ──

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export { VIDEOS_DATASET_ID, CHANNELS_DATASET_ID };
