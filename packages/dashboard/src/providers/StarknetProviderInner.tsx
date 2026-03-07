'use client';
import { StarknetConfig, jsonRpcProvider, argent, braavos } from '@starknet-react/core';
import { sepolia } from '@starknet-react/chains';

// Cartridge RPC allows browser CORS — BlastAPI (publicProvider default) blocks it
const provider = jsonRpcProvider({
  rpc: () => ({ nodeUrl: 'https://api.cartridge.gg/x/starknet/sepolia' }),
});

export function StarknetProviderInner({ children }: { children: React.ReactNode }) {
  return (
    <StarknetConfig
      chains={[sepolia]}
      provider={provider}
      connectors={[argent(), braavos()]}
      autoConnect
    >
      {children}
    </StarknetConfig>
  );
}
