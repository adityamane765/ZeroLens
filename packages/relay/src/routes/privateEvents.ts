import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { verifyFilterProof } from '../services/proofService.js';
import { fetchEventSuperset } from '../services/starknetRpc.js';

export const privateEventsRoute = new Hono();

const RequestSchema = z.object({
  commitment: z.string().startsWith('0x'),
  proofInputs: z.array(z.string()).length(3),
  fromBlock: z.number().int().nonnegative(),
  toBlock: z.union([z.number().int().nonnegative(), z.literal('latest')]),
  chunkSize: z.number().int().min(1).max(500).default(200),
  continuationToken: z.string().optional(),
});

privateEventsRoute.post(
  '/private-events',
  zValidator('json', RequestSchema),
  async (c) => {
    const body = c.req.valid('json');

    // Verify ZK proof (hash preimage) before serving any data
    const proofResult = verifyFilterProof(body.commitment, body.proofInputs);
    if (!proofResult.valid) {
      return c.json({ error: 'invalid proof', reason: proofResult.reason }, 403);
    }

    let superset;
    try {
      superset = await fetchEventSuperset(
        body.fromBlock,
        body.toBlock,
        body.chunkSize,
        body.continuationToken,
      );
    } catch (err) {
      return c.json({ error: 'RPC error', reason: (err as Error).message }, 502);
    }

    // Return full superset — client filters locally using their private filter.
    // The relay never sees the plaintext contract_addr or event_key.
    return c.json({
      ok: true,
      commitment: body.commitment,
      events: superset.events,
      continuation_token: superset.continuation_token,
    });
  },
);
