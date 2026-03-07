'use client';
import { useState } from 'react';
import { useAccount, useProvider } from '@starknet-react/core';
import { hash, num, CallData, BlockTag } from 'starknet';
import { RevealQueuePanel } from '../../components/mempool/RevealQueuePanel';
import { useCommitments } from '../../hooks/useCommitments';
import { darkindexClient } from '../../lib/darkindex';
import type { SubmitCommitmentResult } from '@darkindex/sdk';

const DEFAULT_CONTRACT = '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d';
const DEFAULT_ENTRYPOINT = 'transfer';

const inputStyle = {
  background: '#0f0d1a',
  border: '1px solid #1e1730',
  color: '#67e8f9',
};

function Field({
  label, value, onChange, placeholder, hint,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <label className="text-xs font-mono uppercase tracking-widest" style={{ color: '#3a2f4a' }}>{label}</label>
        {hint && <span className="text-xs font-mono" style={{ color: '#2a2040' }}>{hint}</span>}
      </div>
      <input
        className="w-full rounded-lg px-3 py-2.5 text-xs font-mono outline-none transition-all"
        style={inputStyle}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        onFocus={(e) => { e.currentTarget.style.borderColor = '#0891b2'; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = '#1e1730'; }}
      />
    </div>
  );
}

export default function MempoolPage() {
  const { account, address, status } = useAccount();
  const { provider } = useProvider();
  const { pending, revealed, wsConnected, refetch } = useCommitments();

  const [contractAddr, setContractAddr] = useState(DEFAULT_CONTRACT);
  const [entrypoint, setEntrypoint] = useState(DEFAULT_ENTRYPOINT);

  // transfer-specific fields
  const [recipient, setRecipient] = useState('');
  const [amountDecimal, setAmountDecimal] = useState('0');

  // generic calldata fields (for non-transfer entrypoints)
  const [fields, setFields] = useState<string[]>(['']);

  const [committing, setCommitting] = useState(false);
  const [lastResult, setLastResult] = useState<SubmitCommitmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connected = status === 'connected' && !!account && !!address;
  const isTransfer = entrypoint.trim() === 'transfer';

  // Parse a decimal STRK amount (e.g. "1.5") into u256 low + high felt252 hex strings
  const parseAmount = (decimal: string): [string, string] => {
    const [wholePart = '0', fracPart = ''] = decimal.trim().split('.');
    const frac = fracPart.slice(0, 18).padEnd(18, '0');
    const raw = BigInt(wholePart) * 10n ** 18n + BigInt(frac);
    const low = '0x' + (raw & ((1n << 128n) - 1n)).toString(16);
    const high = '0x' + (raw >> 128n).toString(16);
    return [low, high];
  };

  const getCalldata = (): string[] => {
    if (isTransfer) {
      const to = recipient.trim() || address || '';
      const [low, high] = parseAmount(amountDecimal);
      return [to, low, high];
    }
    return fields.map((f) => f.trim()).filter(Boolean);
  };

  const handleCommit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !address) return;
    setCommitting(true);
    setError(null);
    setLastResult(null);

    try {
      const calldataArr = getCalldata();
      const calls = [{ contractAddress: contractAddr, entrypoint, calldata: calldataArr }];

      const nonce = await provider.getNonceForAddress(address, BlockTag.LATEST);
      // Use provider directly (avoids wallet's internal RPC which rejects "pending" block)
      const compiledCalldata = CallData.compile({ orderCalls: calls });
      const feeEstimate = await provider.getInvokeEstimateFee(
        { contractAddress: address, calldata: compiledCalldata },
        { nonce, version: '0x1' },
        'latest'
      ).catch(() => null);
      const maxFee = feeEstimate
        ? num.toHex((BigInt(feeEstimate.overall_fee) * 3n) / 2n)
        : num.toHex(10n ** 15n); // fallback: 0.001 STRK

      const chainId = await provider.getChainId();
      const txHash = hash.calculateInvokeTransactionHash({
        senderAddress: address,
        version: '0x1',
        compiledCalldata,
        maxFee,
        chainId,
        nonce,
      });

      const result = await darkindexClient.submitPrivateTx({
        txHash,
        senderPubkey: address,
        nonce,
      });

      sessionStorage.setItem(`darkindex:tx:${result.commitment}`, JSON.stringify({
        calls,
        nonce,
        maxFee,
        txHash,
      }));

      setLastResult(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <span className="text-xs font-mono uppercase tracking-widest" style={{ color: '#67e8f9' }}>component 02</span>
        <h1 className="text-3xl font-bold mt-1" style={{ color: '#fff' }}>private mempool</h1>
        <p className="text-sm mt-2 leading-relaxed max-w-2xl" style={{ color: '#5a4f6a' }}>
          Compose a real Starknet transaction. Your wallet computes a commitment over the tx hash —
          the relay locks ordering without seeing the tx. After 30s, you reveal and the relay forwards
          the signed tx to the sequencer.
        </p>
      </div>

      {lastResult && (
        <div
          className="rounded-xl px-5 py-4 flex items-start gap-4"
          style={{ background: '#12102a', border: '1px solid #1e1730' }}
        >
          <span className="text-xs font-mono mt-0.5 shrink-0" style={{ color: '#67e8f9' }}>ZK</span>
          <div className="min-w-0">
            <p className="text-xs" style={{ color: '#5a4f6a' }}>
              commitment accepted — queue position <span style={{ color: '#67e8f9' }}>#{lastResult.position}</span>
            </p>
            <p className="text-xs font-mono mt-1 break-all" style={{ color: '#a78bfa' }}>{lastResult.commitment}</p>
            <p className="text-xs mt-1" style={{ color: '#3a2f4a' }}>
              reveal unlocks in {lastResult.revealAfterSeconds}s — tx hash committed, ordering is final
            </p>
          </div>
        </div>
      )}

      <form
        onSubmit={handleCommit}
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid #1e1730' }}
      >
        <div className="flex items-center gap-1.5 px-4 py-3" style={{ borderBottom: '1px solid #1e1730', background: '#0d0b1a' }}>
          <span className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
          <span className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }} />
          <span className="w-3 h-3 rounded-full" style={{ background: '#28c840' }} />
          <span className="ml-3 text-xs font-mono" style={{ color: '#3a2f4a' }}>
            tx-composer · commit = Poseidon(txHash, sender, nonce, secret)
          </span>
        </div>

        <div className="px-6 py-6 space-y-5" style={{ background: '#12102a' }}>
          {!connected && (
            <div
              className="rounded-lg px-4 py-3 text-xs font-mono"
              style={{ background: '#0d0b1a', border: '1px solid #1e1730', color: '#5a4f6a' }}
            >
              connect wallet (ArgentX / Braavos) to compose a transaction
            </div>
          )}

          {connected && (
            <div className="text-xs font-mono" style={{ color: '#3a2f4a' }}>
              sender: <span style={{ color: '#67e8f9' }}>{address.slice(0, 12)}...{address.slice(-6)}</span>
              <span className="ml-3" style={{ color: '#4ade80' }}>● connected</span>
            </div>
          )}

          <Field label="contract address" value={contractAddr} onChange={setContractAddr} />

          <Field label="entrypoint" value={entrypoint} onChange={setEntrypoint} placeholder="transfer" />

          {/* transfer-specific fields */}
          {isTransfer && (
            <div className="space-y-4 rounded-lg p-4" style={{ background: '#0d0b1a', border: '1px solid #1e1730' }}>
              <p className="text-xs font-mono" style={{ color: '#3a2f4a' }}>transfer calldata</p>
              <Field
                label="recipient"
                value={recipient}
                onChange={setRecipient}
                placeholder={address ?? '0x...'}
                hint="leave blank to use your address"
              />
              <Field
                label="amount (STRK)"
                value={amountDecimal}
                onChange={setAmountDecimal}
                placeholder="0"
                hint="decimal — e.g. 1.5"
              />
            </div>
          )}

          {/* generic calldata fields */}
          {!isTransfer && (
            <div className="space-y-3">
              <label className="text-xs font-mono uppercase tracking-widest" style={{ color: '#3a2f4a' }}>calldata</label>
              {fields.map((f, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <span className="text-xs font-mono w-6 text-right shrink-0" style={{ color: '#3a2f4a' }}>[{i}]</span>
                  <input
                    className="flex-1 rounded-lg px-3 py-2.5 text-xs font-mono outline-none transition-all"
                    style={inputStyle}
                    value={f}
                    onChange={(e) => {
                      const next = [...fields];
                      next[i] = e.target.value;
                      setFields(next);
                    }}
                    placeholder="0x..."
                    spellCheck={false}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#0891b2'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#1e1730'; }}
                  />
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setFields(fields.filter((_, j) => j !== i))}
                      className="text-xs font-mono shrink-0"
                      style={{ color: '#3a2f4a' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#f87171'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#3a2f4a'; }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setFields([...fields, ''])}
                className="text-xs font-mono"
                style={{ color: '#3a2f4a', cursor: 'pointer' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#67e8f9'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#3a2f4a'; }}
              >
                + add field
              </button>
            </div>
          )}

          {error && (
            <div
              className="rounded-lg px-4 py-3 text-xs font-mono"
              style={{ background: '#1a0a0a', border: '1px solid #3a1a1a', color: '#f87171' }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!connected || committing}
            className="px-6 py-2.5 rounded-lg text-xs font-mono font-semibold transition-all"
            style={{
              background: !connected || committing ? '#1e1730' : '#164e63',
              color: !connected || committing ? '#3a2f4a' : '#cffafe',
              border: '1px solid',
              borderColor: !connected || committing ? '#1e1730' : '#0891b2',
              cursor: !connected || committing ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => { if (connected && !committing) (e.currentTarget as HTMLButtonElement).style.background = '#155e75'; }}
            onMouseLeave={(e) => { if (connected && !committing) (e.currentTarget as HTMLButtonElement).style.background = '#164e63'; }}
          >
            {committing ? (
              <span className="flex items-center gap-2">
                <span className="animate-pulse-dot">●</span> estimating fee · committing...
              </span>
            ) : (
              '$ commit-tx --private'
            )}
          </button>
        </div>
      </form>

      <RevealQueuePanel
        pending={pending}
        revealed={revealed}
        wsConnected={wsConnected}
        onRevealed={refetch}
      />
    </div>
  );
}
