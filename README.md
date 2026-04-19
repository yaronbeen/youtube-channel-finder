# YouTube Creator Email Finder

**Find email addresses of YouTube creators by topic keyword — powered by [Bright Data](https://brightdata.com).**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yaronbeen/youtube-channel-finder&env=BRIGHT_DATA_API_KEY&envDescription=Bright%20Data%20API%20key%20for%20YouTube%20Datasets&envLink=https://brightdata.com)

---

## What is this?

Enter any topic keyword (e.g. `ai coding assistant`) and this tool finds YouTube creators publishing content on that topic and extracts their public contact email addresses.

It searches YouTube for relevant videos, identifies the creators behind them, scrapes their public channel pages, scans their video descriptions and external websites, and surfaces any emails found — all via Bright Data's YouTube Datasets API. Results stream live and can be downloaded as a CSV ready for outreach.

You can tune search depth in the UI (`5`, `20`, `40`, `60` videos per keyword) to trade speed for coverage.

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
│  Returns video metadata, descriptions, creator info │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│  Stage 2 · Creator Deduplication                    │
│  Extracts unique creator channel URLs               │
│  Scans video descriptions for emails already        │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│  Stage 3 · Creator Page Scraping                    │
│  Bright Data YouTube Channels Dataset               │
│  Scrapes each creator's About page                  │
│  Extracts bio, subscriber count, external links     │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│  Stage 4 · Email Extraction                         │
│  Regex-based extraction from:                       │
│   - creator About / bio                             │
│   - creator external links                          │
│   - video descriptions                              │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│  Stage 5 · Second-pass Website Scan                 │
│  For creators with no email yet, follows their      │
│  external links and scans /contact + /about pages   │
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
| YouTube Videos | `gd_lk56epmy2i5g7lzu0k` | Discover videos by keyword, get creator info + descriptions |
| YouTube Channels | `gd_lk538t2k2p1k3oos71` | Scrape creator About pages for bio, links, contact info |

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
# Optional: increase polling timeout for slow jobs (milliseconds, default 300000)
# BD_POLL_TIMEOUT_MS=420000
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), enter a keyword, and hit **Search**.

---

## Usage Tips

- **Start narrow** — one focused keyword like `"email marketing saas"` gives more relevant creators than broad terms
- **Use Depth 20** for a good speed/coverage balance
- **Comma-separate up to 10 keywords** to cover related topics in one run
- **Email hit rate** depends on the niche — tech/business creators typically have ~5–15% email visibility
- If you hit timeouts, reduce depth or add `BD_POLL_TIMEOUT_MS=420000` to `.env.local`

---

## Project Structure

```
src/
├── app/
│   ├── api/search/route.ts          # SSE pipeline endpoint
│   ├── page.tsx                     # Main UI
│   └── layout.tsx                   # Root layout + metadata
├── components/
│   ├── SearchForm.tsx               # Keyword input + depth selector + example chips
│   ├── ProgressBar.tsx              # Pipeline progress indicator
│   ├── StatusLog.tsx                # Real-time activity log
│   └── ResultsTable.tsx             # Results table + CSV download
├── hooks/
│   └── useChannelSearch.ts          # SSE consumer + state management
└── lib/
    ├── bright-data.ts               # Datasets API wrapper (trigger/poll/download)
    ├── email-extractor.ts           # Regex email extraction
    ├── website-email.ts             # Second-pass website email scan
    ├── rate-limit.ts                # Per-IP rate limiter
    └── types.ts                     # TypeScript interfaces
```

---

## Real-Time Streaming

The backend streams progress to the frontend via **Server-Sent Events (SSE)**:

| Event | Payload | Description |
|-------|---------|-------------|
| `status` | `{ message, progress }` | Pipeline step update (0–1) |
| `channels` | `{ count }` | Number of unique creators found |
| `result` | `{ channels[] }` | Final results with emails |
| `error` | `{ message }` | Error with guidance |
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
