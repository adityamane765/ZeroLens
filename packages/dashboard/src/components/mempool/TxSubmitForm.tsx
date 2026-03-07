'use client';
import { useState } from 'react';
import type { SubmitCommitmentResult } from '@zerolens/sdk';

interface Props {
  onSubmit: (params: { txHash: string; senderPubkey: string; nonce: string }) => Promise<void>;
  loading: boolean;
  lastResult: SubmitCommitmentResult | null;
}

export function TxSubmitForm({ onSubmit, loading }: Props) {
  const [txHash, setTxHash] = useState('0xabcdef1234567890');
  const [senderPubkey, setSenderPubkey] = useState('0x04cafebabe');
  const [nonce, setNonce] = useState('0x1');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ txHash, senderPubkey, nonce });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid #1e1730' }}
    >
      {/* terminal title bar */}
      <div className="flex items-center gap-1.5 px-4 py-3" style={{ borderBottom: '1px solid #1e1730', background: '#0d0b1a' }}>
        <span className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
        <span className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }} />
        <span className="w-3 h-3 rounded-full" style={{ background: '#28c840' }} />
        <span className="ml-3 text-xs font-mono" style={{ color: '#3a2f4a' }}>commit-reveal · Poseidon(txHash, pubkey, nonce, secret)</span>
      </div>

      <div className="px-6 py-6 space-y-5" style={{ background: '#12102a' }}>
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-widest" style={{ color: '#3a2f4a' }}>transaction hash</label>
            <input
              className="w-full rounded-lg px-3 py-2.5 text-xs font-mono outline-none transition-all"
              style={{ background: '#0f0d1a', border: '1px solid #1e1730', color: '#67e8f9' }}
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              spellCheck={false}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#0891b2'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#1e1730'; }}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-widest" style={{ color: '#3a2f4a' }}>sender pubkey</label>
              <input
                className="w-full rounded-lg px-3 py-2.5 text-xs font-mono outline-none transition-all"
                style={{ background: '#0f0d1a', border: '1px solid #1e1730', color: '#67e8f9' }}
                value={senderPubkey}
                onChange={(e) => setSenderPubkey(e.target.value)}
                spellCheck={false}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#0891b2'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#1e1730'; }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-widest" style={{ color: '#3a2f4a' }}>nonce</label>
              <input
                className="w-full rounded-lg px-3 py-2.5 text-xs font-mono outline-none transition-all"
                style={{ background: '#0f0d1a', border: '1px solid #1e1730', color: '#67e8f9' }}
                value={nonce}
                onChange={(e) => setNonce(e.target.value)}
                spellCheck={false}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#0891b2'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#1e1730'; }}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 rounded-lg text-xs font-mono font-semibold transition-all"
          style={{
            background: loading ? '#1e1730' : '#164e63',
            color: loading ? '#3a2f4a' : '#cffafe',
            border: '1px solid',
            borderColor: loading ? '#1e1730' : '#0891b2',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#155e75'; }}
          onMouseLeave={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#164e63'; }}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="animate-pulse-dot">●</span> committing...
            </span>
          ) : (
            '$ submit-private-tx --commit'
          )}
        </button>
      </div>
    </form>
  );
}
