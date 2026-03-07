'use client';
import { useState } from 'react';
import type { StarknetEvent } from '@darkindex/sdk';

const TRANSFER_KEY = '0x99cd8bde557814842a3121e8ddfd433a539b8c9f14bf31ebf108d12e6196e9';

function decodeTransfer(event: StarknetEvent): { from: string; to: string; amount: string } | null {
  const norm = (s: string) => '0x' + s.toLowerCase().replace(/^0x0*/, '');
  if (norm(event.keys[0] ?? '') !== norm(TRANSFER_KEY)) return null;
  if (event.keys.length < 3) return null;
  const low = event.data[0] ? BigInt(event.data[0]) : 0n;
  const high = event.data[1] ? BigInt(event.data[1]) : 0n;
  const raw = (high << 128n) + low;
  const whole = raw / 10n ** 18n;
  const frac = (raw % 10n ** 18n).toString().padStart(18, '0').replace(/0+$/, '') || '0';
  return { from: event.keys[1], to: event.keys[2], amount: `${whole}.${frac}` };
}

function shortAddr(s: string) {
  return `${s.slice(0, 8)}...${s.slice(-6)}`;
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      style={{ marginLeft: '6px', background: 'none', border: '1px solid #2a2040', borderRadius: '3px', color: copied ? '#4ade80' : '#3a2f4a', fontSize: '10px', padding: '1px 5px', cursor: 'pointer', fontFamily: 'monospace' }}
    >
      {copied ? '✓' : 'copy'}
    </button>
  );
}

export function EventCard({ event }: { event: StarknetEvent }) {
  const transfer = decodeTransfer(event);

  return (
    <div
      className="rounded-xl p-4 space-y-2 font-mono text-xs animate-fadein"
      style={{ background: '#12102a', border: '1px solid #1e1730' }}
    >
      <div className="flex items-center justify-between">
        <span style={{ color: '#a78bfa' }}>block #{event.block_number}</span>
        <a
          href={`https://sepolia.voyager.online/tx/${event.transaction_hash}`}
          target="_blank"
          rel="noreferrer"
          className="transition-colors truncate ml-4 max-w-[220px]"
          style={{ color: '#3a2f4a' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#a78bfa'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#3a2f4a'; }}
        >
          {event.transaction_hash.slice(0, 10)}...{event.transaction_hash.slice(-6)} ↗
        </a>
      </div>

      {transfer ? (
        <>
          <div className="flex items-center gap-2 pt-0.5">
            <span className="px-1.5 py-0.5 rounded" style={{ background: '#1e1730', color: '#a78bfa' }}>Transfer</span>
          </div>
          <div className="flex items-center">
            <span style={{ color: '#3a2f4a' }}>from: </span>
            <span style={{ color: '#c4b5fd', marginLeft: '4px' }}>{shortAddr(transfer.from)}</span>
            <CopyBtn text={transfer.from} />
          </div>
          <div className="flex items-center">
            <span style={{ color: '#3a2f4a' }}>to: </span>
            <span style={{ color: '#c4b5fd', marginLeft: '4px' }}>{shortAddr(transfer.to)}</span>
            <CopyBtn text={transfer.to} />
          </div>
          <div><span style={{ color: '#3a2f4a' }}>amount: </span><span style={{ color: '#4ade80' }}>{transfer.amount} STRK</span></div>
        </>
      ) : (
        <>
          <div className="flex items-center">
            <span style={{ color: '#3a2f4a' }}>from: </span>
            <span style={{ color: '#c4b5fd', marginLeft: '4px' }}>{shortAddr(event.from_address)}</span>
            <CopyBtn text={event.from_address} />
          </div>
          {event.keys.length > 0 && (
            <div className="flex items-center">
              <span style={{ color: '#3a2f4a' }}>keys[0]: </span>
              <span style={{ color: '#5a4f6a', marginLeft: '4px' }}>{event.keys[0].slice(0, 14)}...</span>
              <CopyBtn text={event.keys[0]} />
            </div>
          )}
          {event.data.length > 0 && (
            <div className="flex items-center flex-wrap gap-1">
              <span style={{ color: '#3a2f4a' }}>data: </span>
              {event.data.slice(0, 3).map((d, i) => (
                <span key={i} className="flex items-center">
                  <span style={{ color: '#5a4f6a', marginLeft: '4px' }}>{d.slice(0, 10)}...</span>
                  <CopyBtn text={d} />
                </span>
              ))}
              {event.data.length > 3 && <span style={{ color: '#3a2f4a' }}>+{event.data.length - 3} more</span>}
            </div>
          )}
        </>
      )}
    </div>
  );
}