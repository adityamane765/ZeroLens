import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { verifyTxProof } from '../services/proofService.js';
import { commitmentStore } from '../services/commitmentStore.js';
import { broadcastToClients } from '../ws/dashboardSocket.js';
import { config } from '../config.js';

export const submitCommitmentRoute = new Hono();

const RequestSchema = z.object({
  commitment: z.string().startsWith('0x'),
  proofInputs: z.array(z.string()).length(4),
  commitmentType: z.enum(['filter', 'tx']).default('tx'),
});

submitCommitmentRoute.post(
  '/submit-commitment',
  zValidator('json', RequestSchema),
  async (c) => {
    const body = c.req.valid('json');

    // Reject duplicate commitments
    if (commitmentStore.get(body.commitment)) {
      return c.json({ error: 'commitment already registered' }, 409);
    }

    // Verify ZK proof (hash preimage) before accepting commitment
    const proofResult = verifyTxProof(body.commitment, body.proofInputs);
    if (!proofResult.valid) {
      return c.json({ error: 'invalid proof', reason: proofResult.reason }, 403);
    }

    const entry = commitmentStore.add(
      body.commitment,
      body.commitmentType,
      body.proofInputs,
      config.TIME_LOCK_SECONDS,
    );

    broadcastToClients({ type: 'commitment_added', data: entry });

    return c.json(
      {
        ok: true,
        commitment: body.commitment,
        position: entry.position,
        submittedAt: entry.submittedAt,
        timeLockExpiry: entry.timeLockExpiry,
        revealAfterSeconds: config.TIME_LOCK_SECONDS,
      },
      201,
    );
  },
);
