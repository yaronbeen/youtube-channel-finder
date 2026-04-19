"use client";

import { useMemo } from "react";
import type { Channel } from "../lib/types";

interface ResultsTableProps {
  channels: Channel[];
}

export function ResultsTable({ channels }: ResultsTableProps) {
  const stats = useMemo(() => {
    const withEmail = channels.filter((c) => c.emails.length > 0);
    const totalEmails = channels.reduce((sum, c) => sum + c.emails.length, 0);
    return { total: channels.length, withEmail: withEmail.length, totalEmails };
  }, [channels]);

  if (channels.length === 0) return null;

  const handleDownloadCsv = () => {
    const headers = [
      "Channel Name",
      "Channel URL",
      "Subscribers",
      "Email(s)",
      "Keywords",
      "Description",
      "Links",
    ];

    const rows = channels.map((ch) => [
      escapeCsv(ch.channelName),
      escapeCsv(ch.channelUrl),
      escapeCsv(ch.subscribers),
      escapeCsv(ch.emails.join("; ")),
      escapeCsv(ch.keywords.join("; ")),
      escapeCsv(ch.description),
      escapeCsv(ch.links),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `youtube-channels-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full space-y-4">
      {/* Stats bar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <Stat label="Channels" value={stats.total} />
          <Stat label="With email" value={stats.withEmail} highlight />
          <Stat label="Total emails" value={stats.totalEmails} highlight />
        </div>
        <button
          onClick={handleDownloadCsv}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm text-white transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download CSV
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-900 border-b border-zinc-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Channel
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Subscribers
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Email(s)
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Keywords
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {channels.map((ch, i) => (
                <tr
                  key={i}
                  className="hover:bg-zinc-800/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <a
                      href={ch.channelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white hover:text-[#FF6B35] transition-colors font-medium"
                    >
                      {ch.channelName}
                    </a>
                    {ch.description && (
                      <p className="text-xs text-zinc-500 mt-0.5 max-w-md truncate">
                        {ch.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-300 whitespace-nowrap">
                    {formatSubscribers(ch.subscribers)}
                  </td>
                  <td className="px-4 py-3">
                    {ch.emails.length > 0 ? (
                      <div className="flex flex-col gap-0.5">
                        {ch.emails.map((email, j) => (
                          <a
                            key={j}
                            href={`mailto:${email}`}
                            className="text-[#FF6B35] hover:underline text-xs font-mono"
                          >
                            {email}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <span className="text-zinc-600 text-xs">--</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {ch.keywords.map((kw, j) => (
                        <span
                          key={j}
                          className="text-xs px-2 py-0.5 bg-zinc-800 border border-zinc-700/50 rounded text-zinc-400"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`text-lg font-bold ${highlight ? "text-[#FF6B35]" : "text-white"}`}>
        {value}
      </span>
      <span className="text-xs text-zinc-500">{label}</span>
    </div>
  );
}

function formatSubscribers(value: string): string {
  if (!value) return "--";
  const num = parseInt(value.replace(/[^0-9]/g, ""), 10);
  if (isNaN(num)) return value;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return String(num);
}

function escapeCsv(value: string): string {
  if (!value) return '""';
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
