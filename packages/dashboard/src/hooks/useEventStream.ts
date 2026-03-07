'use client';
import { useState, useCallback } from 'react';
import { darkindexClient } from '../lib/darkindex';
import type { StarknetEvent } from '@darkindex/sdk';

export interface EventStreamState {
  events: StarknetEvent[];
  loading: boolean;
  error: string | null;
  commitment: string | null;
  continuationToken: string | undefined;
}

export function useEventStream() {
  const [state, setState] = useState<EventStreamState>({
    events: [],
    loading: false,
    error: null,
    commitment: null,
    continuationToken: undefined,
  });

  const fetchEvents = useCallback(
    async (params: { contractAddr: string; eventKey: string; fromBlock: number; toBlock: number | 'latest' }) => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const result = await darkindexClient.watchEvents({
          ...params,
          chunkSize: 200,
        });
        setState({
          events: result.events,
          loading: false,
          error: null,
          commitment: result.commitment,
          continuationToken: result.continuation_token,
        });
      } catch (e) {
        setState((s) => ({
          ...s,
          loading: false,
          error: (e as Error).message,
        }));
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setState({ events: [], loading: false, error: null, commitment: null, continuationToken: undefined });
  }, []);

  return { ...state, fetchEvents, reset };
}
