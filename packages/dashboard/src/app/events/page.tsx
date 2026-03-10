'use client';
import { FilterForm } from '../../components/events/FilterForm';
import { EventStreamPanel } from '../../components/events/EventStreamPanel';
import { useEventStream } from '../../hooks/useEventStream';

export default function EventsPage() {
  const { events, loading, error, commitment, fetchEvents } = useEventStream();

  return (
    <div className="space-y-8">
      <div>
        <span className="text-xs font-mono uppercase tracking-widest" style={{ color: '#7c3aed' }}>component 01</span>
        <h1 className="text-3xl font-bold mt-1" style={{ color: '#fff' }}>private event indexer</h1>
        <p className="text-sm mt-2 leading-relaxed max-w-2xl" style={{ color: '#5a4f6a' }}>
          Query Starknet events without revealing your filter to any node or indexer.
          Your contract address and event key are committed via Poseidon hash — the relay enforces access cryptographically.
        </p>
      </div>

      {commitment && (
        <div
          className="rounded-xl px-5 py-4 flex items-start gap-4"
          style={{ background: '#12102a', border: '1px solid #1e1730' }}
        >
          <span className="text-xs font-mono mt-0.5 shrink-0" style={{ color: '#7c3aed' }}>ZK</span>
          <div className="min-w-0">
            <p className="text-xs" style={{ color: '#5a4f6a' }}>active commitment (what the relay sees):</p>
            <p className="text-xs font-mono mt-1 break-all" style={{ color: '#a78bfa' }}>{commitment}</p>
          </div>
        </div>
      )}

      <FilterForm onSubmit={fetchEvents} loading={loading} />

      {error && (
        <div className="rounded-xl px-5 py-4 text-sm font-mono" style={{ background: '#1a0a0a', border: '1px solid #3a1a1a', color: '#f87171' }}>
          {error}
        </div>
      )}

      <EventStreamPanel events={events} queried={!!commitment} />
    </div>
  );
}
