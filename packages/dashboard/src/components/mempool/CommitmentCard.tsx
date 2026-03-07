'use client';
import { useState } from 'react';
import { useAccount } from '@starknet-react/core';
import { TimeLockCountdown } from './TimeLockCountdown';
import { darkindexClient } from '../../lib/darkindex';
import type { PendingEntry } from '../../hooks/useCommitments';

interface StoredTxDetails {
  calls: { contractAddress: string; entrypoint: string; calldata: string[] }[];
  nonce: string;
  maxFee: string;
  txHash: string;
}

interface Props {
  entry: PendingEntry;
  onRevealed: () => void;
}

export function CommitmentCard({ entry, onRevealed }: Props) {
  const { account } = useAccount();
  const [revealing, setRevealing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sequencerTxHash, setSequencerTxHash] = useState<string | null>(null);
  const expired = entry.timeLockExpiry <= Date.now();

  // Retrieve tx details stored at commit time
  const storedRaw = typeof window !== 'undefined'
    ? sessionStorage.getItem(`darkindex:tx:${entry.commitment}`)
    : null;
  const txDetails: StoredTxDetails | null = storedRaw ? JSON.parse(storedRaw) : null;
  const hasWallet = !!account;
  const canReveal = expired && !revealing && (txDetails ? hasWallet : true);

  const handleReveal = async () => {
    setRevealing(true);
    setError(null);

    try {
      let txPayload = '{}';

      if (txDetails && account) {
        // Execute the real tx through the connected wallet.
        // The wallet will prompt the user to sign and submit it to the sequencer.
        const { transaction_hash } = await account.execute(
          txDetails.calls,
          { nonce: txDetails.nonce, maxFee: txDetails.maxFee }
        );
        txPayload = JSON.stringify({ transaction_hash });
        setSequencerTxHash(transaction_hash);
      }

      // Tell the relay the tx was revealed. If we have a real tx_hash,
      // the relay verifies it on-chain to confirm the reveal is binding.
      await darkindexClient.revealTx(entry.commitment, txPayload);
      sessionStorage.removeItem(`darkindex:tx:${entry.commitment}`);
      onRevealed();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRevealing(false);
    }
  };

  return (
    <div
      className="rounded-xl p-4 space-y-3 mb-3 font-mono text-xs animate-fadein"
      style={{ background: '#12102a', border: '1px solid #1e1730' }}
    >
      <div className="flex items-center justify-between">
        <span style={{ color: '#3a2f4a' }}>position <span style={{ color: '#67e8f9' }}>#{entry.position}</span></span>
        <span
          className="px-2 py-0.5 rounded text-xs"
          style={{ background: '#0d0b1a', color: '#3a2f4a', border: '1px solid #1e1730' }}
        >
          {entry.type}
        </span>
      </div>

      <p className="break-all" style={{ color: '#a78bfa' }}>
        {entry.commitment.slice(0, 20)}...{entry.commitment.slice(-8)}
      </p>

      {txDetails && (
        <div className="space-y-0.5" style={{ color: '#3a2f4a' }}>
          <p>contract: <span style={{ color: '#5a4f6a' }}>{txDetails.calls[0]?.contractAddress.slice(0, 10)}...</span></p>
          <p>fn: <span style={{ color: '#5a4f6a' }}>{txDetails.calls[0]?.entrypoint}</span></p>
          <p>nonce: <span style={{ color: '#5a4f6a' }}>{txDetails.nonce}</span></p>
        </div>
      )}

      {!txDetails && (
        <p style={{ color: '#3a2f4a' }}>no tx details stored · dry-run reveal</p>
      )}

      <TimeLockCountdown expiryMs={entry.timeLockExpiry} />

      {sequencerTxHash && (
        <div>
          <p style={{ color: '#4ade80' }}>✓ sequencer tx:</p>
          <a
            href={`https://sepolia.voyager.online/tx/${sequencerTxHash}`}
            target="_blank"
            rel="noreferrer"
            className="break-all"
            style={{ color: '#a78bfa' }}
          >
            {sequencerTxHash.slice(0, 14)}...{sequencerTxHash.slice(-8)} ↗
          </a>
        </div>
      )}

      {error && (
        <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>
      )}

      {txDetails && !hasWallet && expired && (
        <p className="text-xs" style={{ color: '#fbbf24' }}>connect wallet to reveal</p>
      )}

      <button
        onClick={handleReveal}
        disabled={!canReveal}
        className="w-full py-2 rounded-lg text-xs font-mono font-semibold transition-all"
        style={{
          background: !canReveal ? '#0d0b1a' : '#164e63',
          color: !canReveal ? '#3a2f4a' : '#cffafe',
          border: '1px solid',
          borderColor: !canReveal ? '#1e1730' : '#0891b2',
          cursor: !canReveal ? 'not-allowed' : 'pointer',
        }}
        onMouseEnter={(e) => { if (canReveal) (e.currentTarget as HTMLButtonElement).style.background = '#155e75'; }}
        onMouseLeave={(e) => { if (canReveal) (e.currentTarget as HTMLButtonElement).style.background = '#164e63'; }}
      >
        {revealing
          ? '● signing & broadcasting...'
          : expired
            ? '$ reveal-tx --broadcast'
            : '⏳ time-lock active'}
      </button>
    </div>
  );
}
