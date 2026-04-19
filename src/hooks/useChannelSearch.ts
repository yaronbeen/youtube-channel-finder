"use client";

import { useState, useCallback, useRef } from "react";
import type { Channel, SseEvent } from "../lib/types";

export interface SearchState {
  isSearching: boolean;
  progress: number;
  statusMessages: string[];
  channelCount: number;
  channels: Channel[];
  error: string | null;
}

const INITIAL_STATE: SearchState = {
  isSearching: false,
  progress: 0,
  statusMessages: [],
  channelCount: 0,
  channels: [],
  error: null,
};

export function useChannelSearch() {
  const [state, setState] = useState<SearchState>(INITIAL_STATE);
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(async (keywords: string, numPosts: number) => {
    // Reset state
    setState({
      ...INITIAL_STATE,
      isSearching: true,
    });

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords, numPosts }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        setState((prev) => ({
          ...prev,
          isSearching: false,
          error: err.error || `HTTP ${res.status}`,
        }));
        return;
      }

      if (!res.body) {
        setState((prev) => ({
          ...prev,
          isSearching: false,
          error: "No response body",
        }));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let gotTerminalEvent = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const rawEvent of events) {
          const line = rawEvent
            .split("\n")
            .find((entry) => entry.startsWith("data: "));
          if (!line) continue;

          try {
            const event = JSON.parse(line.slice(6)) as SseEvent;
            if (event.type === "done" || event.type === "error") {
              gotTerminalEvent = true;
            }
            handleEvent(event, setState);
          } catch {
            // skip malformed SSE lines
          }
        }
      }

      // Process any remaining buffer
      if (buffer.startsWith("data: ")) {
        try {
          const event = JSON.parse(buffer.slice(6)) as SseEvent;
          if (event.type === "done" || event.type === "error") {
            gotTerminalEvent = true;
          }
          handleEvent(event, setState);
        } catch {
          // skip
        }
      }

      if (!gotTerminalEvent) {
        setState((prev) => ({
          ...prev,
          isSearching: false,
          error: prev.error ?? "Search stream ended unexpectedly. Please try again.",
        }));
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setState((prev) => ({
        ...prev,
        isSearching: false,
        error: err instanceof Error ? err.message : "Search failed",
      }));
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState(INITIAL_STATE);
  }, []);

  return { ...state, search, reset };
}

function handleEvent(
  event: SseEvent,
  setState: React.Dispatch<React.SetStateAction<SearchState>>
) {
  switch (event.type) {
    case "status":
      setState((prev) => ({
        ...prev,
        progress: event.progress,
        statusMessages: [...prev.statusMessages, event.message],
      }));
      break;

    case "channels":
      setState((prev) => ({
        ...prev,
        channelCount: event.count,
      }));
      break;

    case "result":
      setState((prev) => ({
        ...prev,
        channels: event.channels,
      }));
      break;

    case "error":
      setState((prev) => ({
        ...prev,
        isSearching: false,
        error: event.message,
      }));
      break;

    case "done":
      setState((prev) => ({
        ...prev,
        isSearching: false,
      }));
      break;
  }
}
