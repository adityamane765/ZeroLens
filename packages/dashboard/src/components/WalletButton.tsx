'use client';
import dynamic from 'next/dynamic';

const WalletButtonInner = dynamic(
  () => import('./WalletButtonInner').then((m) => m.WalletButtonInner),
  { ssr: false, loading: () => <div className="w-24 h-7 bg-gray-800 rounded animate-pulse" /> }
);

export function WalletButton() {
  return <WalletButtonInner />;
}
