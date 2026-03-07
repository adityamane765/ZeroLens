import { ZeroLensClient } from '@zerolens/sdk';

export const RELAY_URL =
  process.env.NEXT_PUBLIC_RELAY_URL ?? 'http://localhost:3001';

// Lazy singleton — only instantiated client-side (avoids SSR issues)
let _client: ZeroLensClient | null = null;

function getClient(): ZeroLensClient {
  if (!_client) {
    _client = new ZeroLensClient({ relayUrl: RELAY_URL });
  }
  return _client;
}

// Proxy object so imports work cleanly without SSR instantiation
export const zerolensClient = {
  watchEvents: (...args: Parameters<ZeroLensClient['watchEvents']>) =>
    getClient().watchEvents(...args),
  submitPrivateTx: (...args: Parameters<ZeroLensClient['submitPrivateTx']>) =>
    getClient().submitPrivateTx(...args),
  revealTx: (...args: Parameters<ZeroLensClient['revealTx']>) =>
    getClient().revealTx(...args),
  getQueueStatus: () => getClient().getQueueStatus(),
};
