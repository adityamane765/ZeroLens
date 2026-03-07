'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WalletButton } from './WalletButton';

const NAV = [
  { href: '/events', label: 'event indexer' },
  { href: '/mempool', label: 'private mempool' },
  { href: '/docs', label: 'docs' },
];

export function Header() {
  const pathname = usePathname();
  return (
    <header
      className="sticky top-0 z-50 backdrop-blur"
      style={{ borderBottom: '1px solid #1e1730', background: 'rgba(15,13,26,0.85)' }}
    >
      <div className="container mx-auto px-4 max-w-6xl h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-mono text-sm" style={{ color: '#5a4f6a' }}>
            dark<span style={{ color: '#a78bfa' }}>index</span>
          </Link>
          <nav className="flex gap-6">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="font-mono text-xs transition-colors"
                style={{ color: pathname === item.href ? '#a78bfa' : '#5a4f6a' }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <WalletButton />
      </div>
    </header>
  );
}
