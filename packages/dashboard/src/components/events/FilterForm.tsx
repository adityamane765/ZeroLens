'use client';
import { useState } from 'react';

interface Props {
  onSubmit: (params: { contractAddr: string; eventKey: string; fromBlock: number; toBlock: number | 'latest' }) => void;
  loading: boolean;
}

// Poseidon selectors for common Starknet events (starknet_keccak of the event name)
const KNOWN_KEYS = [
  { label: 'Transfer',                        value: '0x99cd8bde557814842a3121e8ddfd433a539b8c9f14bf31ebf108d12e6196e9',  hint: 'ERC-20 / ERC-721 transfers' },
  { label: 'simple_event',                    value: '0x15bd0500dc9d7e69ab9577f73a8d753e8761bed10f25ba0f124254dc4edb8b4', hint: 'simple_event(argument, my_array)' },
  { label: 'PriceTick',                       value: '0x316cd066c3b766079f2b1adf4444c53f8fcf80fe1ce5c3f3ad492ce78fbbe9f', hint: 'Oracle price tick' },
  { label: 'RewardsSuppliedToDelegationPool', value: '0x99f25da3a1ac61dd57efe764c2d59fe1c7a46f1af83f02cacb02788604e458',  hint: 'Staking rewards supplied' },
  { label: 'custom',                          value: '__custom__', hint: 'Enter selector manually' },
];

const DEFAULT_ADDR = '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d';

export function FilterForm({ onSubmit, loading }: Props) {
  const [contractAddr, setContractAddr] = useState(DEFAULT_ADDR);
  const [selectedKey, setSelectedKey] = useState(KNOWN_KEYS[0].value);
  const [customKey, setCustomKey] = useState('');
  const [fromBlock, setFromBlock] = useState(7007677);
  const [toBlockStr, setToBlockStr] = useState('latest');

  const isCustom = selectedKey === '__custom__';
  const eventKey = isCustom ? customKey : selectedKey;

  const handleKeySelect = (value: string) => {
    setSelectedKey(value);
    // Clear contract address for non-Transfer events so filter matches any contract
    if (value !== KNOWN_KEYS[0].value) {
      setContractAddr('');
    } else if (value === KNOWN_KEYS[0].value) {
      setContractAddr(DEFAULT_ADDR);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const toBlock = toBlockStr.trim().toLowerCase() === 'latest' ? 'latest' : Number(toBlockStr);
    onSubmit({ contractAddr, eventKey, fromBlock, toBlock });
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
        <span className="ml-3 text-xs font-mono" style={{ color: '#3a2f4a' }}>private-filter · these values never leave your browser</span>
      </div>

      <div className="px-6 py-6 space-y-5" style={{ background: '#12102a' }}>

        {/* contract address */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono uppercase tracking-widest" style={{ color: '#3a2f4a' }}>contract address</label>
          <input
            className="w-full rounded-lg px-3 py-2.5 text-xs font-mono outline-none transition-all"
            style={{ background: '#0f0d1a', border: '1px solid #1e1730', color: '#a78bfa' }}
            value={contractAddr}
            onChange={(e) => setContractAddr(e.target.value)}
            spellCheck={false}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#7c3aed'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#1e1730'; }}
          />
        </div>

        {/* event key */}
        <div className="space-y-2">
          <label className="text-xs font-mono uppercase tracking-widest" style={{ color: '#3a2f4a' }}>event key (selector)</label>
          <div className="flex flex-wrap gap-2">
            {KNOWN_KEYS.map((k) => {
              const active = selectedKey === k.value;
              return (
                <button
                  key={k.label}
                  type="button"
                  title={k.hint}
                  onClick={() => handleKeySelect(k.value)}
                  className="px-3 py-1 rounded-full text-xs font-mono transition-all"
                  style={{
                    background: active ? '#4c1d95' : '#0f0d1a',
                    color: active ? '#e9d5ff' : '#5a4f6a',
                    border: `1px solid ${active ? '#7c3aed' : '#1e1730'}`,
                    cursor: 'pointer',
                  }}
                >
                  {k.label}
                </button>
              );
            })}
          </div>
          {isCustom ? (
            <input
              className="w-full rounded-lg px-3 py-2.5 text-xs font-mono outline-none transition-all"
              style={{ background: '#0f0d1a', border: '1px solid #1e1730', color: '#a78bfa' }}
              placeholder="0x..."
              value={customKey}
              onChange={(e) => setCustomKey(e.target.value)}
              spellCheck={false}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#7c3aed'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#1e1730'; }}
            />
          ) : (
            <p className="text-xs font-mono px-1 truncate" style={{ color: '#3a2f4a' }}>{eventKey}</p>
          )}
        </div>

        {/* block range */}
        <div className="grid grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-widest" style={{ color: '#3a2f4a' }}>from block</label>
            <input
              type="number"
              className="w-full rounded-lg px-3 py-2.5 text-xs font-mono outline-none transition-all"
              style={{ background: '#0f0d1a', border: '1px solid #1e1730', color: '#a78bfa' }}
              value={fromBlock}
              onChange={(e) => setFromBlock(Number(e.target.value))}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#7c3aed'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#1e1730'; }}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-widest" style={{ color: '#3a2f4a' }}>to block</label>
            <input
              className="w-full rounded-lg px-3 py-2.5 text-xs font-mono outline-none transition-all"
              style={{ background: '#0f0d1a', border: '1px solid #1e1730', color: '#a78bfa' }}
              placeholder="number or latest"
              value={toBlockStr}
              onChange={(e) => setToBlockStr(e.target.value)}
              spellCheck={false}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#7c3aed'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#1e1730'; }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || (isCustom && !customKey)}
          className="px-6 py-2.5 rounded-lg text-xs font-mono font-semibold transition-all"
          style={{
            background: loading ? '#1e1730' : '#4c1d95',
            color: loading ? '#3a2f4a' : '#e9d5ff',
            border: '1px solid',
            borderColor: loading ? '#1e1730' : '#7c3aed',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#5b21b6'; }}
          onMouseLeave={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#4c1d95'; }}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="animate-pulse-dot">●</span> querying...
            </span>
          ) : (
            '$ watch-events --private'
          )}
        </button>
      </div>
    </form>
  );
}
