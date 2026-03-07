import { DarkIndexClient } from '@darkindex/sdk';

export const RELAY_URL =
  process.env.NEXT_PUBLIC_RELAY_URL ?? 'http://localhost:3001';

// Lazy singleton — only instantiated client-side (avoids SSR issues)
let _client: DarkIndexClient | null = null;

function getClient(): DarkIndexClient {
  if (!_client) {
    _client = new DarkIndexClient({ relayUrl: RELAY_URL });
  }
  return _client;
}

// Proxy object so imports work cleanly without SSR instantiation
export const darkindexClient = {
  watchEvents: (...args: Parameters<DarkIndexClient['watchEvents']>) =>
    getClient().watchEvents(...args),
  submitPrivateTx: (...args: Parameters<DarkIndexClient['submitPrivateTx']>) =>
    getClient().submitPrivateTx(...args),
  revealTx: (...args: Parameters<DarkIndexClient['revealTx']>) =>
    getClient().revealTx(...args),
  getQueueStatus: () => getClient().getQueueStatus(),
};
