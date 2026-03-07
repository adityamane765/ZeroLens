'use client';
import Link from 'next/link';
import { BlockStream } from '../components/BlockStream';

export default function HomePage() {
  return (
    <div className="min-h-[90vh] flex items-center px-4">

      {/* background grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(167,139,250,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(167,139,250,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />
      <div
        className="fixed top-0 left-1/2 pointer-events-none"
        style={{
          transform: 'translateX(-50%)',
          width: 800,
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.4), transparent)',
        }}
      />

      <div className="relative z-10 w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        {/* left: block stream */}
        <BlockStream />

        {/* right: title + cards */}
        <div className="flex flex-col gap-6">
          <h1 className="text-5xl font-bold tracking-tight leading-tight" style={{ color: '#fff' }}>
            zero<span style={{ background: 'linear-gradient(90deg, #c4b5fd, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>lens</span>
          </h1>

          <div className="flex flex-col gap-px rounded-xl overflow-hidden" style={{ background: '#1e1730' }}>
            <Link href="/events">
              <div className="flex items-center justify-between px-5 py-4 transition-colors cursor-pointer" style={{ background: '#12102a' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#16143a'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#12102a'; }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: '#a78bfa' }}>private event indexer</p>
                  <p className="text-xs mt-0.5" style={{ color: '#3a2f4a' }}>Poseidon-committed filter · relay sees only hash</p>
                </div>
                <span className="text-xs font-mono" style={{ color: '#3a2f4a' }}>01 →</span>
              </div>
            </Link>
            <Link href="/mempool">
              <div className="flex items-center justify-between px-5 py-4 transition-colors cursor-pointer" style={{ background: '#12102a' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#16143a'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#12102a'; }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: '#67e8f9' }}>private mempool</p>
                  <p className="text-xs mt-0.5" style={{ color: '#3a2f4a' }}>commit-reveal · 30s time-lock · front-running impossible</p>
                </div>
                <span className="text-xs font-mono" style={{ color: '#3a2f4a' }}>02 →</span>
              </div>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
