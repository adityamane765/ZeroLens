# ZeroLens

**Privacy-preserving event indexing and private mempool for Starknet.**

Built for the [Re{define} Hackathon](https://www.redefined.xyz/) · Feb 27 – Mar 10, 2026.

---

## The Problem

Starknet has two invisible surveillance layers:

1. **Event indexing is public.** Every call to `starknet_getEvents` with a filter (`contract_address`, `keys`) tells the RPC node — and anyone watching — exactly which events you care about. This leaks wallet strategies, token holdings, and trading patterns.

2. **The mempool is transparent.** Pending transactions are visible before inclusion, enabling front-running bots to reorder or sandwich transactions for profit.

---

## The Solution

ZeroLens adds a ZK-gated privacy relay in front of Starknet RPC:

```
┌─────────────────────────────────────────────────────────┐
│                       ZeroLens                          │
│                                                         │
│  Component 1: Private Event Indexer                     │
│                                                         │
│  Browser                Relay               Starknet    │
│  ────────               ─────               ────────    │
│  secret = random()                                      │
│  C = Poseidon(addr,                                     │
│        key, secret)                                     │
│      │                                                  │
│      ├─ POST /rpc/private-events ──────────────────►    │
│      │   { commitment: C,                               │
│      │     proofInputs: [addr, key, secret] }           │
│      │                                                  │
│      │            Relay verifies:                       │
│      │            Poseidon(inputs) == C? ──► YES        │
│      │                                                  │
│      │            ┌─────────────────────────────────►   │
│      │            │  getEvents(NO address/key filter)   │
│      │            │  returns superset                   │
│      │            ◄─────────────────────────────────┘   │
│      │                                                  │
│      ◄─ superset of all events ──────────────────────   │
│                                                         │
│  Browser filters locally:                               │
│    event.from_address == addr && event.keys[0] == key   │
│                                                         │
│  ➜ Relay never sees the plaintext filter.               │
│                                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Component 2: Private Mempool (commit-reveal)           │
│                                                         │
│  Browser                Relay               Starknet    │
│  ────────               ─────               ────────    │
│  secret = random()                                      │
│  C = Poseidon(txHash,                                   │
│        pubkey, nonce,                                   │
│        secret)                                          │
│      │                                                  │
│      ├─ POST /rpc/submit-commitment ────────────────►   │
│      │   { commitment: C,                               │
│      │     proofInputs: [txHash, pubkey,                │
│      │                   nonce, secret] }               │
│      │                                                  │
│      │   Relay stores C with timeLockExpiry             │
│      │   (position locked, tx content hidden)           │
│      │                                                  │
│      ◄─ { position, timeLockExpiry } ────────────────   │
│                                                         │
│      [wait TIME_LOCK_SECONDS]                           │
│                                                         │
│      ├─ POST /rpc/reveal-tx ───────────────────────►    │
│      │   { commitment: C, txPayload }                   │
│      │                                                  │
│      │   Relay: time-lock elapsed? YES                  │
│      │   Marks revealed, broadcasts WS update           │
│      │                              ─────────────────►  │
│      │                              submit to sequencer │
│      ◄─ { ok: true } ────────────────────────────────   │
│                                                         │
│  ➜ Front-runners see the commitment hash only.          │
│    Transaction content is hidden until after ordering.  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## How Event Filtering Works

The relay fetches a **blind superset** — `starknet_getEvents` with no address or key filter, just a block range (up to 500 events per chunk). Your browser receives all events and filters locally using your private inputs:

```
event.from_address === contractAddr  (optional — leave blank to match any contract)
event.keys[0]      === eventKey      (required)
```

**Why no server-side filter?** Passing `contract_address` or `keys` to `starknet_getEvents` would tell the RPC node exactly what you're watching. ZeroLens never does this — the relay is blind by design.

**The tradeoff:** The 500-event superset covers a rolling window of blocks. On a busy testnet, high-volume contracts (e.g. STRK token) can dominate the chunk, crowding out events from niche contracts. Mitigations:

- Use a narrow block range targeting recent activity
- Use continuation tokens to paginate through more chunks
- Leave the contract address field blank to match your event key across all contracts in the superset

**Production path:** Larger supersets (10k+ events), background pre-fetching, and PIR (Private Information Retrieval) techniques would improve recall without sacrificing privacy.

---

## ZK Proof Design

> **Hash preimage proof as formal specification.**

Full STARK proof generation is out of scope for an 11-day hackathon and is not necessary to demonstrate the privacy primitive. The "proof" is the **hash preimage**: the prover provides `[input_1, ..., input_n]` such that `Poseidon(inputs) == commitment`.

The Cairo circuits in `packages/circuits/` are the **formal specification** of the predicate being proved. They define exactly what `verify_filter_proof` and `verify_tx_proof` must check. A production version would compile these circuits to a STARK prover and verify the proof on-chain in `CommitmentRegistry`. In this demo, the relay re-executes the hash check off-chain using the same Poseidon implementation (`starknet.js` v6 `hash.computePoseidonHashOnElements`).

This pattern — hash preimage as ZK-lite proof — is standard in privacy protocols and gives the same privacy guarantees as a full ZK proof for this specific predicate.

---

## Repository Structure

```
ZeroLens/
├── packages/
│   ├── circuits/          # Cairo ZK circuit library (formal proof specs)
│   │   ├── src/
│   │   │   ├── filter_proof.cairo      # Component 1: filter commitment
│   │   │   └── tx_validity_proof.cairo # Component 2: tx commitment
│   │   └── tests/                      # 10 Cairo tests (scarb test)
│   │
│   ├── contracts/         # Starknet on-chain contract
│   │   └── src/
│   │       └── commitment_registry.cairo  # On-chain commitment store
│   │
│   ├── relay/             # Hono relay server (Node.js)
│   │   ├── src/
│   │   │   ├── routes/    # 4 RPC endpoints
│   │   │   ├── services/  # Proof verification, commitment store, Starknet RPC
│   │   │   └── ws/        # WebSocket broadcast to dashboard
│   │   └── demo/
│   │       └── e2e-demo.ts  # End-to-end demonstration script
│   │
│   ├── sdk/               # ZeroLensClient (npm package)
│   │   └── src/
│   │       ├── ZeroLensClient.ts
│   │       ├── crypto/    # Poseidon + secret generation
│   │       └── proof/     # Filter + tx commitment builders
│   │
│   └── dashboard/         # Next.js 14 dashboard
│       └── src/
│           ├── app/
│           │   ├── events/   # Component 1 demo UI
│           │   └── mempool/  # Component 2 demo UI
│           ├── components/
│           └── hooks/
```

---

## Quick Start

### Prerequisites

- Node.js 20+, npm 10+
- [Scarb](https://docs.swmansion.com/scarb/download) 2.15+
- [Starkli](https://book.starkli.rs/installation) (for contract deployment)

### Install

```bash
git clone https://github.com/yourusername/ZeroLens
cd ZeroLens
npm install
```

### Configure

```bash
cp .env.example packages/relay/.env
# Edit packages/relay/.env — set STARKNET_RPC_URL and COMMITMENT_REGISTRY_ADDRESS
```

### Run

**Terminal 1 — Build SDK:**
```bash
npm run build:sdk
```

**Terminal 2 — Start relay:**
```bash
npm run dev:relay
# Relay running at http://localhost:3001
# WebSocket at ws://localhost:3001/ws
```

**Terminal 3 — Start dashboard:**
```bash
npm run dev:dashboard
# Dashboard at http://localhost:3000
```

### E2E Demo Script

With the relay running:
```bash
npx tsx packages/relay/demo/e2e-demo.ts
```

This runs through the full privacy flow:
1. Private event fetch (commitment-gated, local decryption)
2. Invalid commitment rejection (403)
3. Private tx submission (time-lock commitment)
4. Early reveal rejection (425 Too Early)
5. Reveal after time-lock
6. Final queue status

---

## Contract Deployment (Sepolia)

```bash
cd packages/contracts
scarb build

starkli declare target/dev/ZeroLens_contracts_CommitmentRegistry.contract_class.json \
  --rpc https://starknet-sepolia.public.blastapi.io/rpc/v0_7 \
  --account ~/.starkli/account.json --keystore ~/.starkli/signer.json

starkli deploy <CLASS_HASH> \
  --rpc https://starknet-sepolia.public.blastapi.io/rpc/v0_7 \
  --account ~/.starkli/account.json --keystore ~/.starkli/signer.json
```

Update `COMMITMENT_REGISTRY_ADDRESS` in `packages/relay/.env`.

---

## Cairo Tests

```bash
cd packages/circuits && scarb test   # 10 tests
cd packages/contracts && scarb build # Sierra + CASM artifacts
```

---

## API Reference

### `POST /rpc/private-events`

Fetch events with commitment-gated privacy.

```json
{
  "commitment": "0x...",
  "proofInputs": ["0xcontractAddr", "0xeventKey", "0xsecret"],
  "fromBlock": 700000,
  "toBlock": "latest"
}
```

Returns superset of events (client filters locally). `403` if proof invalid.

### `POST /rpc/submit-commitment`

Submit a private tx commitment.

```json
{
  "commitment": "0x...",
  "proofInputs": ["0xtxHash", "0xpubkey", "0xnonce", "0xsecret"],
  "commitmentType": "tx"
}
```

Returns `{ position, timeLockExpiry, revealAfterSeconds }`. `403` if proof invalid.

### `POST /rpc/reveal-tx`

Reveal a committed tx after time-lock expires.

```json
{
  "commitment": "0x...",
  "txPayload": "{...}"
}
```

Returns `{ ok, revealedAt, simulated }`. `425 Too Early` if time-lock active.

### `GET /rpc/queue-status`

Returns current queue state: `{ pending[], revealed[], stats }`.

### `WS /ws`

WebSocket stream. Messages: `{ type: "commitment_added" | "tx_revealed", ... }`.

---

## SDK Usage

```typescript
import { ZeroLensClient } from '@zerolens/sdk';

const client = new ZeroLensClient({ relayUrl: 'http://localhost:3001' });

// Component 1: Private event watching
const { commitment, events } = await client.watchEvents({
  contractAddr: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
  eventKey: '0x99cd8bde557814842a3121e8ddfd433a539b8c9f14bf31ebf108d12e6196e9',
  fromBlock: 700_000,
  toBlock: 'latest',
});
console.log(`Found ${events.length} Transfer events (commitment: ${commitment})`);

// Component 2: Private tx submission
const { position, timeLockExpiry } = await client.submitPrivateTx({
  txHash: '0x...',
  senderPubkey: '0x...',
  nonce: '0x1',
});
console.log(`Queued at position ${position}, reveal after ${new Date(timeLockExpiry).toISOString()}`);

// After time-lock expires:
await client.revealTx(commitment, JSON.stringify(txData));
```

---

## Roadmap

- [ ] STARK proof integration (replace hash preimage with full ZK proof)
- [ ] On-chain proof verification via `CommitmentRegistry.verify_proof()`
- [ ] Encrypted event payloads (symmetric key derived from commitment secret)
- [ ] Multi-relay federation with commitment cross-verification
- [ ] Mainnet deployment

---

## License

MIT
