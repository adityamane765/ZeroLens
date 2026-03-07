import { Hono } from 'hono';
import { commitmentStore } from '../services/commitmentStore.js';

export const queueStatusRoute = new Hono();

queueStatusRoute.get('/queue-status', (c) => {
  const pending = commitmentStore.listPending();
  const revealed = commitmentStore.listRevealed();
  const now = Date.now();

  return c.json({
    pending: pending.map((e) => ({
      commitment: e.commitment,
      position: e.position,
      type: e.type,
      submittedAt: e.submittedAt,
      timeLockExpiry: e.timeLockExpiry,
      timeLockRemainingMs: Math.max(0, e.timeLockExpiry - now),
    })),
    revealed: revealed.map((e) => ({
      commitment: e.commitment,
      position: e.position,
      type: e.type,
      revealedAt: e.revealedAt,
    })),
    stats: {
      totalPending: pending.length,
      totalRevealed: revealed.length,
      totalCommitments: commitmentStore.size(),
    },
  });
});
