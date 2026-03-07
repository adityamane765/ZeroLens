'use client';
import { CommitmentCard } from './CommitmentCard';
import type { PendingEntry, RevealedEntry } from '../../hooks/useCommitments';

interface Props {
  pending: PendingEntry[];
  revealed: RevealedEntry[];
  wsConnected: boolean;
  onRevealed: () => void;
}

export function RevealQueuePanel({ pending, revealed, wsConnected, onRevealed }: Props) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <h2 className="text-xs font-mono uppercase tracking-widest" style={{ color: '#5a4f6a' }}>commit queue</h2>
        <span
          className="text-xs px-2 py-0.5 rounded font-mono"
          style={{
            background: wsConnected ? '#0a1a0f' : '#0d0b1a',
            color: wsConnected ? '#4ade80' : '#3a2f4a',
            border: `1px solid ${wsConnected ? '#166534' : '#1e1730'}`,
          }}
        >
          {wsConnected ? '● live' : '○ polling'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-mono mb-3 uppercase tracking-widest" style={{ color: '#67e8f9' }}>
            pending ({pending.length})
          </p>
          {pending.length === 0 ? (
            <div
              className="rounded-xl p-6 text-center text-xs font-mono"
              style={{ border: '1px dashed #1e1730', color: '#3a2f4a' }}
            >
              no pending commitments
            </div>
          ) : (
            pending.map((e) => (
              <CommitmentCard key={e.commitment} entry={e} onRevealed={onRevealed} />
            ))
          )}
        </div>

        <div>
          <p className="text-xs font-mono mb-3 uppercase tracking-widest" style={{ color: '#4ade80' }}>
            revealed ({revealed.length})
          </p>
          {revealed.length === 0 ? (
            <div
              className="rounded-xl p-6 text-center text-xs font-mono"
              style={{ border: '1px dashed #1e1730', color: '#3a2f4a' }}
            >
              no revealed transactions yet
            </div>
          ) : (
            revealed.map((e) => (
              <div
                key={e.commitment}
                className="rounded-xl p-4 mb-3 text-xs font-mono space-y-1.5 animate-fadein"
                style={{ background: '#0a1a0f', border: '1px solid #166534' }}
              >
                <div className="flex items-center justify-between">
                  <span style={{ color: '#3a2f4a' }}>#{e.position}</span>
                  <span style={{ color: '#4ade80' }}>✓ revealed</span>
                </div>
                <p className="break-all" style={{ color: '#a78bfa' }}>
                  {e.commitment.slice(0, 20)}...{e.commitment.slice(-8)}
                </p>
                <p style={{ color: '#3a2f4a' }}>
                  {new Date(e.revealedAt).toLocaleTimeString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
