# YouTube Channel Finder

**Discover YouTube channels by keyword and extract their contact emails — powered by [Bright Data](https://brightdata.com).**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yaronbeen/youtube-channel-finder&env=BRIGHT_DATA_API_KEY&envDescription=Bright%20Data%20API%20key%20for%20YouTube%20Datasets&envLink=https://brightdata.com)

---

## What is this?

YouTube Channel Finder is a web app that takes keyword search queries, discovers YouTube channels publishing relevant content, and extracts their contact email addresses — all using Bright Data's YouTube Datasets API.

You can tune search depth in the UI (`5`, `20`, `40`, `60` videos per keyword) to trade speed for coverage.

The entire pipeline streams live to the browser via **Server-Sent Events (SSE)**: you see progress updates as videos are discovered, channels are deduplicated, and emails are extracted in real-time.

**Built with [Bright Data](https://brightdata.com)**

---

## How it works

```
User enters keywords (e.g. "ai coding assistant")
        │
        ▼
┌─────────────────────────────────────────────────────┐
│  Stage 1 · Video Discovery                          │
│  Bright Data YouTube Videos Dataset                 │
│  Searches YouTube for videos matching keywords      │
│  Returns video metadata + channel info              │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│  Stage 2 · Channel Deduplication                    │
│  Extracts unique channel URLs from video results    │
│  Tracks which keywords led to each channel          │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│  Stage 3 · Channel Scraping                         │
│  Bright Data YouTube Channels Dataset               │
│  Scrapes each channel's About page for details      │
│  Extracts description, subscriber count, links      │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│  Stage 4 · Email Extraction                         │
│  Regex-based extraction from:                       │
│   - channel About data                              │
│   - channel links                                   │
│   - video descriptions                              │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│  Stage 5 · Second-pass Link Scan                    │
│  If no emails found, scan public external links     │
│  (including /contact and /about pages) for emails.  │
└─────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js 16](https://nextjs.org) · React 19 · TypeScript 5 |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com) |
| **Data Infrastructure** | [Bright Data](https://brightdata.com) YouTube Datasets API |
| **Deployment** | [Vercel](https://vercel.com) |

---

## Bright Data Datasets Used

| Dataset | Dataset ID | Purpose |
|---------|-----------|---------|
| YouTube Videos | `gd_lk56epmy2i5g7lzu0k` | Discovers videos by keyword search |
| YouTube Channels | `gd_lk538t2k2p1k3oos71` | Scrapes channel About pages for details |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Bright Data](https://brightdata.com) account with Datasets API access

### 1. Clone the repo

```bash
git clone https://github.com/yaronbeen/youtube-channel-finder.git
cd youtube-channel-finder
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file:

```env
BRIGHT_DATA_API_KEY=your_brightdata_api_key
# Optional: increase polling timeout for slow jobs (milliseconds)
# BD_POLL_TIMEOUT_MS=420000
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and search for any keyword.

---

## Project Structure

```
src/
├── app/
│   ├── api/search/route.ts          # SSE pipeline endpoint
│   ├── page.tsx                     # Main UI page
│   └── layout.tsx                   # Root layout + metadata
├── components/
│   ├── SearchForm.tsx               # Keyword input + example chips
│   ├── ProgressBar.tsx              # Pipeline progress indicator
│   ├── StatusLog.tsx                # Real-time activity log
│   └── ResultsTable.tsx             # Channel results + CSV download
├── hooks/
│   └── useChannelSearch.ts          # SSE consumer + state management
└── lib/
    ├── bright-data.ts               # Datasets API wrapper (trigger/poll/download)
    ├── email-extractor.ts           # Regex email extraction
    ├── rate-limit.ts                # Per-IP rate limiter
    └── types.ts                     # TypeScript interfaces
```

---

## Real-Time Streaming

The backend streams progress to the frontend via **Server-Sent Events (SSE)**:

| Event | Payload | Description |
|-------|---------|-------------|
| `status` | `{ message, progress }` | Pipeline progress update (0–1) |
| `channels` | `{ count }` | Number of unique channels discovered |
| `result` | `{ channels[] }` | Final channel results with emails |
| `error` | `{ message }` | Error message |
| `done` | — | Pipeline complete |

---

## Rate Limiting

The live demo enforces **1 search per IP per 24 hours** via in-memory rate limiting.

When running locally with your own API key, this limit resets on server restart.

---

## Deployment

### Deploy to Vercel (one-click)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yaronbeen/youtube-channel-finder&env=BRIGHT_DATA_API_KEY&envDescription=Bright%20Data%20API%20key%20for%20YouTube%20Datasets&envLink=https://brightdata.com)

Add `BRIGHT_DATA_API_KEY` in your Vercel project settings.

### Manual deploy

```bash
npm run build
npx vercel deploy --prod
```

---

## License

MIT © [Bright Data](https://brightdata.com)
