"use client";

import { useState } from "react";

const EXAMPLE_SEARCHES = [
  "ai coding assistant",
  "bright data web scraping",
  "cursor vs copilot",
  "n8n automation tutorial",
  "langchain agent tutorial",
];

interface SearchFormProps {
  onSearch: (keywords: string, numPosts: number) => void;
  isSearching: boolean;
}

export function SearchForm({ onSearch, isSearching }: SearchFormProps) {
  const [query, setQuery] = useState("");
  const [numPosts, setNumPosts] = useState(20);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isSearching) return;
    onSearch(query.trim(), numPosts);
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex gap-3 flex-wrap">
        <div className="relative flex-1">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Topic keywords, e.g. ai coding assistant..."
            disabled={isSearching}
            className="w-full h-12 pl-12 pr-4 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] disabled:opacity-50 transition-colors"
          />
        </div>
        <label className="h-12 px-3 bg-zinc-900 border border-zinc-700 rounded-xl text-zinc-400 text-sm flex items-center gap-2">
          <span>Depth</span>
          <select
            value={numPosts}
            onChange={(e) => setNumPosts(Number(e.target.value))}
            disabled={isSearching}
            className="bg-zinc-950 border border-zinc-700 rounded-md px-2 py-1 text-zinc-200 text-sm focus:outline-none"
          >
            <option value={5}>5 videos</option>
            <option value={20}>20 videos</option>
            <option value={40}>40 videos</option>
            <option value={60}>60 videos</option>
          </select>
        </label>
        <button
          type="submit"
          disabled={!query.trim() || isSearching}
          className="h-12 px-6 bg-[#FF6B35] hover:bg-[#e55a27] text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 whitespace-nowrap"
        >
          {isSearching ? (
            <>
                <LoadingSpinner />
                Searching...
              </>
            ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search
            </>
          )}
        </button>
      </form>

      {!isSearching && (
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-xs text-zinc-500">Try:</span>
          {EXAMPLE_SEARCHES.map((example) => (
            <button
              key={example}
              onClick={() => {
                setQuery(example);
                onSearch(example, numPosts);
              }}
              className="text-xs px-3 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded-full text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors cursor-pointer"
            >
              {example}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
