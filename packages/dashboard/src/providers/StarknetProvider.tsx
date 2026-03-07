'use client';
import dynamic from 'next/dynamic';

// starknet-react is ESM-only and cannot run server-side.
// Wrap it in a dynamic import with ssr: false so Next.js never tries to SSR it.
const StarknetProviderInner = dynamic(
  () => import('./StarknetProviderInner').then((m) => m.StarknetProviderInner),
  { ssr: false }
);

export function StarknetProvider({ children }: { children: React.ReactNode }) {
  return <StarknetProviderInner>{children}</StarknetProviderInner>;
}
