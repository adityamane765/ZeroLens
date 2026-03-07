import Link from 'next/link';

const sections = [
  { id: 'overview', label: 'Overview' },
  { id: 'event-indexer', label: 'Event Indexer' },
  { id: 'private-mempool', label: 'Private Mempool' },
  { id: 'proof-design', label: 'Proof Design' },
  { id: 'contract', label: 'Contract' },
];

const eventSteps = [
  { step: '01', title: 'Commit locally', body: 'Client computes commitment = Poseidon(contractAddr, eventKey, secret). The secret never leaves the browser.' },
  { step: '02', title: 'Submit proof', body: 'Client sends {commitment, proofInputs} to the relay. The relay verifies the hash preimage — never sees the plaintext filter.' },
  { step: '03', title: 'Relay fetches superset', body: 'Relay calls Starknet RPC with NO address/key filter — returns all events in the block range.' },
  { step: '04', title: 'Filter locally', body: 'Client filters the superset by contractAddr + eventKey. The relay never learns what you were watching.' },
];

const mempoolSteps = [
  { step: '01', title: 'Commit tx', body: 'Client computes commitment = Poseidon(txHash, pubkey, nonce, secret) and sends to relay with proof.' },
  { step: '02', title: 'Time-lock', body: 'Relay stores the commitment with a 30s time-lock. Position in queue is locked at submission — ordering cannot be manipulated.' },
  { step: '03', title: 'Reveal', body: 'After time-lock expires, client reveals the full tx payload. Relay verifies it matches the commitment.' },
  { step: '04', title: 'Sequencer submit', body: 'Relay submits in commit-timestamp order. Front-running impossible — sequencer only sees commitments until reveal.' },
];

const proofFacts = [
  { label: 'hash function', value: 'Poseidon (Starknet-native)' },
  { label: 'proof type', value: 'hash preimage' },
  { label: 'Cairo circuit', value: 'filter_proof.cairo + tx_validity_proof.cairo' },
  { label: 'relay verify', value: 'poseidonHashMany(inputs) === commitment' },
  { label: 'secret size', value: '31 bytes (fits felt252)' },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen">
      <div className="mb-6 flex items-center gap-2 text-xs font-mono" style={{ color: '#3a2f4a' }}>
        <Link href="/" className="transition-colors hover:text-violet-400">darkindex</Link>
        <span>/</span>
        <span style={{ color: '#5a4f6a' }}>docs</span>
      </div>

      <div className="max-w-5xl flex gap-16">

        {/* sidebar */}
        <aside className="hidden md:block w-40 shrink-0">
          <div className="sticky top-24">
            <p className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: '#2a2040' }}>on this page</p>
            <ul className="flex flex-col gap-2.5">
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-xs font-mono transition-colors" style={{ color: '#3a2f4a' }}>
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* content */}
        <div className="flex-1 min-w-0 space-y-16 pb-16">

          <section id="overview">
            <span className="text-xs font-mono uppercase tracking-widest" style={{ color: '#7c3aed' }}>documentation</span>
            <h1 className="text-3xl font-bold mt-2 mb-4" style={{ color: '#fff' }}>How DarkIndex works</h1>
            <div className="text-sm leading-relaxed space-y-3" style={{ color: '#5a4f6a' }}>
              <p>Starknet has two surveillance gaps: every RPC query reveals which addresses and events you are watching, and the mempool is transparent — pending transactions are visible before inclusion.</p>
              <p>DarkIndex adds a ZK-gated privacy relay that enforces cryptographic filter commitments (Poseidon hash preimages) and a commit-reveal mempool queue with time-lock ordering.</p>
            </div>
          </section>

          <section id="event-indexer" className="scroll-mt-8">
            <h2 className="text-xl font-semibold mb-6" style={{ color: '#fff' }}>Private Event Indexer</h2>
            <div className="flex flex-col gap-px rounded-2xl overflow-hidden" style={{ background: '#1e1730' }}>
              {eventSteps.map((item) => (
                <div key={item.step} className="flex gap-6 px-6 py-5 items-start" style={{ background: '#12102a' }}>
                  <span className="text-xs font-mono mt-0.5 shrink-0" style={{ color: '#3a2f4a' }}>{item.step}</span>
                  <div>
                    <h3 className="text-sm font-semibold mb-1" style={{ color: '#a78bfa' }}>{item.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: '#5a4f6a' }}>{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl p-5 font-mono text-xs leading-7" style={{ background: '#0d0b1a', border: '1px solid #1e1730' }}>
              <div style={{ color: '#3a2f4a' }}>{'// what the relay sees'}</div>
              <div><span style={{ color: '#a78bfa' }}>commitment</span><span style={{ color: '#5a4f6a' }}> = </span><span style={{ color: '#ec4899' }}>0x3c1a7b2c56571cf3...</span></div>
              <div><span style={{ color: '#a78bfa' }}>proofInputs</span><span style={{ color: '#5a4f6a' }}> = </span><span style={{ color: '#ec4899' }}>[felt, felt, felt]</span></div>
              <div className="mt-2" style={{ color: '#3a2f4a' }}>{'// contractAddr + eventKey → never transmitted'}</div>
            </div>
          </section>

          <section id="private-mempool" className="scroll-mt-8">
            <h2 className="text-xl font-semibold mb-6" style={{ color: '#fff' }}>Private Mempool</h2>
            <div className="flex flex-col gap-px rounded-2xl overflow-hidden" style={{ background: '#1e1730' }}>
              {mempoolSteps.map((item) => (
                <div key={item.step} className="flex gap-6 px-6 py-5 items-start" style={{ background: '#12102a' }}>
                  <span className="text-xs font-mono mt-0.5 shrink-0" style={{ color: '#3a2f4a' }}>{item.step}</span>
                  <div>
                    <h3 className="text-sm font-semibold mb-1" style={{ color: '#67e8f9' }}>{item.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: '#5a4f6a' }}>{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section id="proof-design" className="scroll-mt-8">
            <h2 className="text-xl font-semibold mb-6" style={{ color: '#fff' }}>Proof Design</h2>
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #1e1730' }}>
              <div className="divide-y" style={{ borderColor: '#1e1730' }}>
                {proofFacts.map((f) => (
                  <div key={f.label} className="flex items-center gap-6 px-6 py-4" style={{ background: '#12102a' }}>
                    <span className="text-xs font-mono uppercase tracking-widest shrink-0 w-36" style={{ color: '#3a2f4a' }}>{f.label}</span>
                    <span className="text-xs font-mono" style={{ color: '#a78bfa' }}>{f.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed" style={{ color: '#5a4f6a' }}>
              Full STARK proof generation is out of scope. The proof is the hash preimage — providing inputs that reconstruct the commitment. The Cairo circuits are the formal specification:{' '}
              <code className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ color: '#a78bfa', background: 'rgba(124,58,237,0.1)' }}>poseidon_hash_span</code> in Cairo matches{' '}
              <code className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ color: '#a78bfa', background: 'rgba(124,58,237,0.1)' }}>poseidonHashMany</code> in starknet.js — same field, deterministic.
            </p>
          </section>

          <section id="contract" className="scroll-mt-8">
            <h2 className="text-xl font-semibold mb-6" style={{ color: '#fff' }}>Contract</h2>
            <div className="rounded-xl overflow-hidden mb-4" style={{ border: '1px solid #1e1730' }}>
              <div className="divide-y" style={{ borderColor: '#1e1730' }}>
                <div className="flex items-center justify-between px-5 py-4" style={{ background: '#12102a' }}>
                  <span className="text-xs font-mono uppercase tracking-widest" style={{ color: '#3a2f4a' }}>CommitmentRegistry · Sepolia</span>
                  <code className="text-xs font-mono" style={{ color: '#a78bfa' }}>0x55c0dcf4...77bef</code>
                </div>
                <div className="flex items-center justify-between px-5 py-4" style={{ background: '#12102a' }}>
                  <span className="text-xs font-mono uppercase tracking-widest" style={{ color: '#3a2f4a' }}>network</span>
                  <code className="text-xs font-mono" style={{ color: '#5a4f6a' }}>Starknet Sepolia · RPC v0_10</code>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-px rounded-xl overflow-hidden" style={{ background: '#1e1730' }}>
              {[
                { fn: 'register_commitment(commitment, type)', desc: 'Anchor a commitment hash on-chain. Emits CommitmentRegistered.' },
                { fn: 'verify_proof(commitment, proof_inputs)', desc: 'On-chain Poseidon verification. Returns bool.' },
                { fn: 'reveal_tx(commitment)', desc: 'Mark a commitment as revealed. Emits TxRevealed.' },
                { fn: 'get_commitment_count()', desc: 'Total commitments registered.' },
              ].map((item) => (
                <div key={item.fn} className="flex flex-col md:flex-row md:items-center gap-1 md:gap-6 px-5 py-3.5" style={{ background: '#12102a' }}>
                  <code className="text-xs font-mono shrink-0" style={{ color: '#a78bfa' }}>{item.fn}</code>
                  <span className="text-xs" style={{ color: '#5a4f6a' }}>{item.desc}</span>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
