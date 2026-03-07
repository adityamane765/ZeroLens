'use client';
import { useEffect, useState } from 'react';

const REDACTED = '█████████████████████████';

const seed = [
  { block: 7008101, status: 'indexed', hash: '0x3f9a...c821' },
  { block: 7008099, status: 'indexed', hash: '0x1d4b...7f03' },
  { block: 7008097, status: 'watching', hash: REDACTED },
  { block: 7008095, status: 'indexed', hash: '0x8c2e...a14d' },
  { block: 7008093, status: 'watching', hash: REDACTED },
  { block: 7008091, status: 'indexed', hash: '0x5a7c...2b9e' },
];

export function BlockStream() {
  const [lines, setLines] = useState(seed);

  useEffect(() => {
    const interval = setInterval(() => {
      setLines((prev) => {
        const top = prev[0];
        const newBlock = top.block + 2;
        const watching = Math.random() > 0.6;
        const newLine = {
          block: newBlock,
          status: watching ? 'watching' : 'indexed',
          hash: watching ? REDACTED : `0x${Math.random().toString(16).slice(2, 6)}...${Math.random().toString(16).slice(2, 6)}`,
        };
        return [newLine, ...prev.slice(0, 5)];
      });
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="w-full rounded-xl overflow-hidden font-mono text-xs"
      style={{ border: '1px solid #1e1730', background: '#0d0b1a' }}
    >
      {/* title bar */}
      <div className="flex items-center gap-1.5 px-4 py-2.5" style={{ borderBottom: '1px solid #1e1730' }}>
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#ff5f57' }} />
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#febc2e' }} />
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#28c840' }} />
        <span className="ml-3" style={{ color: '#3a2f4a' }}>zerolens · starknet-sepolia · watching</span>
        <span className="ml-auto flex items-center gap-1.5" style={{ color: '#28c840' }}>
          <span className="w-1.5 h-1.5 rounded-full inline-block animate-pulse-dot" style={{ background: '#28c840' }} />
          live
        </span>
      </div>

      {/* stream */}
      <div className="px-4 py-3 space-y-1.5">
        {lines.map((line, i) => (
          <div
            key={line.block}
            className="flex items-center gap-3 transition-all"
            style={{ opacity: i === 0 ? 1 : 1 - i * 0.12 }}
          >
            <span style={{ color: '#3a2f4a', minWidth: '2.5rem' }}>blk</span>
            <span style={{ color: '#5a4f6a' }}>{line.block}</span>
            <span className="flex-1 truncate" style={{ color: line.status === 'watching' ? '#a78bfa' : '#2a2040' }}>
              {line.hash}
            </span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded"
              style={{
                background: line.status === 'watching' ? 'rgba(124,58,237,0.15)' : 'transparent',
                color: line.status === 'watching' ? '#a78bfa' : '#3a2f4a',
                border: `1px solid ${line.status === 'watching' ? 'rgba(124,58,237,0.3)' : '#1e1730'}`,
              }}
            >
              {line.status === 'watching' ? '⬛ private' : '✓ indexed'}
            </span>
          </div>
        ))}
      </div>

      <div className="px-4 py-2 flex items-center gap-2" style={{ borderTop: '1px solid #1e1730' }}>
        <span style={{ color: '#4a7c59' }}>›</span>
        <span style={{ color: '#3a2f4a' }}>filter: </span>
        <span style={{ color: '#7c3aed' }}>Poseidon(addr, key, secret)</span>
        <span className="inline-block w-1.5 h-3.5 ml-1 animate-pulse" style={{ background: '#7c3aed', opacity: 0.7 }} />
      </div>
    </div>
  );
}
