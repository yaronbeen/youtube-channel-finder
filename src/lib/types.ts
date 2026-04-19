// ── Bright Data API types ──

export interface VideoSearchInput {
  keyword: string;
  num_of_posts: number;
  start_date: string;
  end_date: string;
  country: string;
}

export interface ChannelScrapeInput {
  url: string;
}

export interface BrightDataTriggerResponse {
  snapshot_id: string;
}

export interface BrightDataProgressResponse {
  status: string;
  [key: string]: unknown;
}

// ── Video result from Bright Data ──

export interface VideoResult {
  url?: string;
  title?: string;
  channel_url?: string;
  channel_name?: string;
  channel_id?: string;
  views?: number;
  date_posted?: string;
  description?: string;
  subscribers?: string | number;
  discovery_input?: { keyword?: string };
  input?: {
    keyword?: string;
    discovery_input?: { keyword?: string };
  };
  [key: string]: unknown;
}

// ── Channel result from Bright Data ──

export interface ChannelResult {
  url?: string;
  name?: string;
  channel_name?: string;
  subscribers?: string | number;
  description?: string;
  links?: string | Record<string, string>[] | unknown;
  about?: string;
  country?: string;
  total_videos?: number;
  joined_date?: string;
  input?: { url?: string };
  [key: string]: unknown;
}

// ── Processed creator for frontend ──

export interface Channel {
  channelUrl: string;
  channelName: string;   // creator display name
  subscribers: string;
  description: string;
  emails: string[];
  links: string;
  keywords: string[];    // topic keywords that surfaced this creator
}

// ── SSE Event types ──

export type SseEvent =
  | { type: "status"; message: string; progress: number }
  | { type: "channels"; count: number }   // count of unique creators found
  | { type: "result"; channels: Channel[] }
  | { type: "error"; message: string }
  | { type: "done" };
