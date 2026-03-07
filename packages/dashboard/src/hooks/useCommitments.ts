'use client';
import { useEffect, useState, useCallback } from 'react';
import { RELAY_URL } from '../lib/darkindex';

export interface PendingEntry {
  commitment: string;
  position: number;
  type: string;
  submittedAt: number;
  timeLockExpiry: number;
  timeLockRemainingMs: number;
}

export interface RevealedEntry {
  commitment: string;
  position: number;
  type: string;
  revealedAt: number;
}

export function useCommitments() {
  const [pending, setPending] = useState<PendingEntry[]>([]);
  const [revealed, setRevealed] = useState<RevealedEntry[]>([]);
  const [wsConnected, setWsConnected] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${RELAY_URL}/rpc/queue-status`);
      const data = await res.json();
      setPending(data.pending ?? []);
      setRevealed(data.revealed ?? []);
    } catch {
      // silently ignore polling errors
    }
  }, []);

  useEffect(() => {
    fetchStatus();

    // WebSocket for live updates
    const wsUrl = RELAY_URL.replace(/^http/, 'ws') + '/ws';
    let ws: WebSocket;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => setWsConnected(true);
      ws.onclose = () => {
        setWsConnected(false);
        reconnectTimer = setTimeout(connect, 3000);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string);
          if (msg.type === 'commitment_added' && msg.data) {
            const d = msg.data;
            setPending((prev) => [
              ...prev.filter((e) => e.commitment !== d.commitment),
              {
                commitment: d.commitment,
                position: d.position,
                type: d.type,
                submittedAt: d.submittedAt,
                timeLockExpiry: d.timeLockExpiry,
                timeLockRemainingMs: Math.max(0, d.timeLockExpiry - Date.now()),
              },
            ]);
          }
          if (msg.type === 'tx_revealed' && msg.data) {
            const d = msg.data;
            setPending((prev) => prev.filter((e) => e.commitment !== d.commitment));
            setRevealed((prev) => [
              ...prev,
              { commitment: d.commitment, position: d.position, type: d.type, revealedAt: d.revealedAt },
            ]);
          }
        } catch {
          // ignore malformed messages
        }
      };
    };

    connect();

    // Polling fallback every 5s to keep state in sync
    const pollInterval = setInterval(fetchStatus, 5000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [fetchStatus]);

  return { pending, revealed, wsConnected, refetch: fetchStatus };
}
