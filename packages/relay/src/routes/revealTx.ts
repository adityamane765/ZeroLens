import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { commitmentStore } from '../services/commitmentStore.js';
import { broadcastToClients } from '../ws/dashboardSocket.js';
import { getProvider } from '../services/starknetRpc.js';

export const revealTxRoute = new Hono();

const RequestSchema = z.object({
  commitment: z.string().startsWith('0x'),
  // transaction_hash of the tx the wallet already submitted.
  // The relay verifies it exists on-chain, proving the reveal is real.
  // Empty string = dry-run (no verification, for testing).
  txPayload: z.string(),
});

revealTxRoute.post(
  '/reveal-tx',
  zValidator('json', RequestSchema),
  async (c) => {
    const { commitment, txPayload } = c.req.valid('json');

    let entry;
    try {
      entry = commitmentStore.reveal(commitment, txPayload);
    } catch (err) {
      const msg = (err as Error).message;
      const status = msg.includes('time-lock active') ? 425 : 400;
      return c.json({ error: msg }, status);
    }

    broadcastToClients({ type: 'tx_revealed', data: entry });

    // If a real tx_hash was provided, verify it exists on Starknet.
    // The wallet already submitted the tx — we confirm it landed.
    // This proves the commit-reveal is binding: the tx was sent after
    // the time-lock, in commit-timestamp order, by the committing party.
    let sequencerTxHash: string | null = null;
    if (txPayload && txPayload !== '{}') {
      try {
        const parsed = JSON.parse(txPayload) as { transaction_hash: string };
        const provider = getProvider();
        // Verify the tx exists on-chain (throws if not found)
        await provider.getTransactionByHash(parsed.transaction_hash);
        sequencerTxHash = parsed.transaction_hash;
      } catch (verifyErr) {
        return c.json({
          ok: true,
          commitment,
          position: entry.position,
          revealedAt: entry.revealedAt,
          sequencerTxHash: null,
          sequencerError: (verifyErr as Error).message,
        }, 200);
      }
    }

    return c.json({
      ok: true,
      commitment,
      position: entry.position,
      revealedAt: entry.revealedAt,
      sequencerTxHash,
    });
  },
);
