'use client';
import type { StarknetEvent } from '@zerolens/sdk';
import { EventCard } from './EventCard';

function exportJson(events: StarknetEvent[]) {
  const blob = new Blob([JSON.stringify(events, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `zerolens-events-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function EventStreamPanel({ events, queried }: { events: StarknetEvent[]; queried: boolean }) {
  if (events.length === 0) {
    return (
      <div
        className="rounded-xl p-12 text-center"
        style={{ border: '1px dashed #1e1730' }}
      >
        {queried ? (
          <p className="text-sm font-mono" style={{ color: '#3a2f4a' }}>no events found matching your filter</p>
        ) : (
          <>
            <p className="text-sm font-mono" style={{ color: '#3a2f4a' }}>submit a private filter above to query events</p>
            <p className="text-xs font-mono mt-1" style={{ color: '#2a2040' }}>the relay verifies your ZK proof before serving any data</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono uppercase tracking-widest" style={{ color: '#3a2f4a' }}>filtered events</span>
        <div className="flex items-center gap-4">
          <span className="text-xs font-mono" style={{ color: '#5a4f6a' }}>{events.length} results · filtered locally</span>
          <button
            onClick={() => exportJson(events)}
            className="text-xs font-mono px-3 py-1 rounded-lg transition-all"
            style={{
              background: '#0f0d1a',
              color: '#5a4f6a',
              border: '1px solid #1e1730',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = '#a78bfa';
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#7c3aed';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = '#5a4f6a';
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#1e1730';
            }}
          >
            ↓ export json
          </button>
        </div>
      </div>
      <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {events.map((event, i) => (
          <EventCard key={`${event.transaction_hash}-${i}`} event={event} />
        ))}
      </div>
    </div>
  );
}
