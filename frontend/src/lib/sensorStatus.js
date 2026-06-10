import { useState, useEffect } from "react";

// A sensor node is "active" only while fresh data keeps arriving. If no new data
// has been received within this window, the node is considered inactive again.
export const ACTIVE_TIMEOUT_MS = 15000; // 15s

// Node data objects carry a local `_receivedAt` timestamp (set when a WebSocket
// message for that node arrives). A node is active when that timestamp is within
// the freshness window relative to `now`.
export function isNodeActive(nodeData, now = Date.now()) {
    if (!nodeData || !nodeData._receivedAt) return false;
    return now - nodeData._receivedAt <= ACTIVE_TIMEOUT_MS;
}

// Re-render on an interval so timeout-based active state flips to inactive even
// when no new data arrives. Returns a `now` timestamp that ticks periodically.
export function useNow(intervalMs = 3000) {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), intervalMs);
        return () => clearInterval(id);
    }, [intervalMs]);
    return now;
}
