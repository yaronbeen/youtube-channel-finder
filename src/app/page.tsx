"use client";

import { SearchForm } from "../components/SearchForm";
import { ProgressBar } from "../components/ProgressBar";
import { StatusLog } from "../components/StatusLog";
import { ResultsTable } from "../components/ResultsTable";
import { useChannelSearch } from "../hooks/useChannelSearch";
import Link from "next/link";

export default function Home() {
  const {
    isSearching,
    progress,
    statusMessages,
    channels,
    error,
    search,
    reset,
  } = useChannelSearch();

  const hasResults = channels.length > 0;

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col">
      {/* ── Header ── */}
      <header className="border-b border-zinc-800 bg-[#09090b]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <BrightDataLogo />
              <span className="text-zinc-600 text-lg font-light">/</span>
              <span className="text-white font-medium text-sm">YouTube Channel Finder</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://docs.brightdata.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <DocIcon />
              Docs
            </a>
            <a
              href="https://github.com/yaronbeen/bright-data-youtube-outreach"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <GitHubIcon />
              Code
            </a>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col">
        {/* Hero section */}
        <section className="pt-16 pb-10 px-6">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h1 className="text-4xl font-bold text-white tracking-tight">
              YouTube Channel Finder
            </h1>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              Search YouTube by keyword, discover creators, and extract their
              contact emails. Powered by{" "}
              <a
                href="https://brightdata.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#FF6B35] hover:underline"
              >
                Bright Data
              </a>
              &apos;s YouTube Datasets API.
            </p>

            {/* Tech badges */}
            <div className="flex items-center justify-center gap-2 pt-2">
              {["TypeScript", "Next.js", "Bright Data"].map((badge) => (
                <span
                  key={badge}
                  className="text-xs px-3 py-1 bg-zinc-800/60 border border-zinc-700/40 rounded-full text-zinc-400"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Search section */}
        <section className="px-6 pb-6">
          <div className="max-w-3xl mx-auto">
            <SearchForm onSearch={search} isSearching={isSearching} />
          </div>
        </section>

        {/* Results section */}
        <section className="flex-1 px-6 pb-16">
          <div className="max-w-6xl mx-auto space-y-4">
            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-red-300">{error}</span>
                </div>
                <button
                  onClick={reset}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Progress */}
            {(isSearching || progress > 0) && (
              <ProgressBar progress={progress} isActive={isSearching} />
            )}

            {/* Status log */}
            <StatusLog messages={statusMessages} isActive={isSearching} />

            {/* Results table */}
            {hasResults && <ResultsTable channels={channels} />}

            {/* Empty state (only when not searching and no results) */}
            {!isSearching && !hasResults && !error && statusMessages.length === 0 && (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 mb-4">
                  <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-zinc-300 mb-1">
                  Ready to discover channels
                </h3>
                <p className="text-sm text-zinc-500 max-w-md mx-auto">
                  Enter keywords above to search YouTube for relevant channels
                  and extract their contact information.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-800 py-6">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <p className="text-xs text-zinc-600">
            Built with{" "}
            <a
              href="https://brightdata.com"
              className="text-zinc-500 hover:text-white transition-colors"
            >
              Bright Data
            </a>{" "}
            Datasets API
          </p>
          <a
            href="https://brightdata.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-zinc-500 hover:text-white transition-colors"
          >
            brightdata.com
          </a>
        </div>
      </footer>
    </div>
  );
}

// ── Inline SVG icons ──

function BrightDataLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#FF6B35" />
      <path
        d="M8 10h6a4 4 0 010 8H8V10zM8 18h7a4 4 0 010 8H8V18z"
        fill="white"
        fillOpacity="0.9"
      />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}
