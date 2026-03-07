'use client';
import { useState } from 'react';
import { useAccount, useConnect, useDisconnect, useInjectedConnectors, argent, braavos } from '@starknet-react/core';
import type { Connector } from '@starknet-react/core';

export function WalletButtonInner() {
  const { address, status } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const [open, setOpen] = useState(false);

  // Scan for installed wallets; always show argent + braavos as fallback install links
  const { connectors } = useInjectedConnectors({
    recommended: [argent(), braavos()],
    includeRecommended: 'always',
    order: 'alphabetical',
  });

  if (status === 'connected' && address) {
    return (
      <button
        onClick={() => disconnect()}
        className="text-xs font-mono px-3 py-1.5 rounded-lg transition-all"
        style={{ background: '#12102a', border: '1px solid #1e1730', color: '#a78bfa' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#7c3aed'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#1e1730'; }}
      >
        {address.slice(0, 8)}...{address.slice(-4)}
      </button>
    );
  }

  const handleConnect = (connector: Connector) => {
    connect({ connector });
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-xs font-mono px-3 py-1.5 rounded-lg transition-all"
        style={{
          background: '#4c1d95',
          border: '1px solid #7c3aed',
          color: '#e9d5ff',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#5b21b6'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#4c1d95'; }}
      >
        connect wallet
      </button>

      {open && (
        <>
          {/* backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          {/* dropdown */}
          <div
            className="absolute right-0 top-9 z-50 rounded-xl overflow-hidden min-w-[180px]"
            style={{ background: '#12102a', border: '1px solid #1e1730' }}
          >
            <div className="px-4 py-2.5" style={{ borderBottom: '1px solid #1e1730' }}>
              <p className="text-xs font-mono uppercase tracking-widest" style={{ color: '#3a2f4a' }}>select wallet</p>
            </div>
            {connectors.length === 0 ? (
              <div className="px-4 py-3 text-xs font-mono" style={{ color: '#3a2f4a' }}>
                no wallets detected
              </div>
            ) : (
              connectors.map((connector) => (
                <button
                  key={connector.id}
                  onClick={() => handleConnect(connector)}
                  className="w-full text-left px-4 py-3 text-xs font-mono transition-all"
                  style={{ color: '#a78bfa', background: 'transparent' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#1e1730'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                >
                  {connector.name}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
