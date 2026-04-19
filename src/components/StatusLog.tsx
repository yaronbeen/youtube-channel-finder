"use client";

import { useEffect, useRef } from "react";

interface StatusLogProps {
  messages: string[];
  isActive: boolean;
}

export function StatusLog({ messages, isActive }: StatusLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) return null;

  return (
    <div className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800 bg-zinc-900">
        <div className={`w-2 h-2 rounded-full ${isActive ? "bg-green-500 animate-pulse" : "bg-zinc-600"}`} />
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
          Activity Log
        </span>
      </div>
      <div
        ref={scrollRef}
        className="max-h-48 overflow-y-auto p-3 space-y-1 font-mono text-xs"
      >
        {messages.map((msg, i) => (
          <div key={i} className="flex gap-2 text-zinc-400">
            <span className="text-zinc-600 select-none shrink-0">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className={i === messages.length - 1 && isActive ? "text-[#FF6B35]" : ""}>
              {msg}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
