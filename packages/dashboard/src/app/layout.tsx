import type { Metadata } from 'next';
import './globals.css';
import { StarknetProvider } from '../providers/StarknetProvider';
import { Header } from '../components/Header';

export const metadata: Metadata = {
  title: 'ZeroLens — Private Starknet Indexer',
  description:
    'ZK-gated private event indexer and mempool simulator for Starknet.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased" style={{ background: '#0f0d1a', color: '#f1f5f9' }}>
        <StarknetProvider>
          <Header />
          <main className="container mx-auto px-4 py-10 max-w-6xl">{children}</main>
        </StarknetProvider>
      </body>
    </html>
  );
}
