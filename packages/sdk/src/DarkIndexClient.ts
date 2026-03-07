import { createFilterCommitment, type FilterProofBundle } from './proof/filterProof.js';
import { createTxCommitment, type TxProofBundle } from './proof/txValidityProof.js';

export interface DarkIndexClientOptions {
  relayUrl: string;
}

export interface WatchEventsOptions {
  contractAddr: string;
  eventKey: string;
  fromBlock: number;
  toBlock: number | 'latest';
  chunkSize?: number;
  continuationToken?: string;
}

export interface StarknetEvent {
  from_address: string;
  keys: string[];
  data: string[];
  block_number: number;
  transaction_hash: string;
}

export interface WatchEventsResult {
  commitment: string;
  events: StarknetEvent[];
  continuation_token?: string;
}

export interface SubmitCommitmentResult {
  ok: boolean;
  commitment: string;
  position: number;
  submittedAt: number;
  timeLockExpiry: number;
  revealAfterSeconds: number;
}

export interface RevealResult {
  ok: boolean;
  commitment: string;
  position: number;
  revealedAt: number;
  /** Real Starknet tx hash from the sequencer, or null for dry-run. */
  sequencerTxHash: string | null;
  /** Set if the sequencer rejected the tx (ordering still proven). */
  sequencerError?: string;
}

export class DarkIndexClient {
  private relayUrl: string;
  private filterBundles = new Map<string, FilterProofBundle>();
  private txBundles = new Map<string, TxProofBundle>();

  constructor(options: DarkIndexClientOptions) {
    this.relayUrl = options.relayUrl.replace(/\/$/, '');
  }

  /**
   * Component 1: Private event watching.
   *
   * 1. Creates a filter commitment locally: Poseidon(contractAddr, eventKey, secret)
   * 2. Sends commitment + proof to relay (relay sees ONLY the commitment hash)
   * 3. Relay fetches a broad superset of events from Starknet RPC (no address/key filter)
   * 4. Client filters the superset locally — relay never learns the plaintext filter
   */
  async watchEvents(options: WatchEventsOptions): Promise<WatchEventsResult> {
    const bundle = createFilterCommitment(options.contractAddr, options.eventKey);
    this.filterBundles.set(bundle.commitment, bundle);

    const response = await fetch(`${this.relayUrl}/rpc/private-events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commitment: bundle.commitment,
        proofInputs: bundle.proofInputs,
        fromBlock: options.fromBlock,
        toBlock: options.toBlock,
        chunkSize: options.chunkSize ?? 200,
        continuationToken: options.continuationToken,
      }),
    });

    if (!response.ok) {
      const err = (await response.json()) as { error: string; reason?: string };
      throw new Error(`Relay rejected proof: ${err.reason ?? err.error}`);
    }

    const data = (await response.json()) as {
      events: StarknetEvent[];
      continuation_token?: string;
    };

    // Normalize felt252 addresses: strip leading zeros after 0x for comparison
    const norm = (s: string) => '0x' + s.toLowerCase().replace(/^0x0*/, '');
    const rawAddr = options.contractAddr.trim();
    const targetAddr = rawAddr ? norm(rawAddr) : null;
    const targetKey = norm(options.eventKey);

    // Local filtering — relay never learned this filter
    const filtered = data.events.filter(
      (event) =>
        (!targetAddr || norm(event.from_address) === targetAddr) &&
        norm(event.keys[0] ?? '') === targetKey,
    );

    return {
      commitment: bundle.commitment,
      events: filtered,
      continuation_token: data.continuation_token,
    };
  }

  /**
   * Component 2: Private tx submission.
   *
   * 1. Creates a tx commitment locally: Poseidon(txHash, senderPubkey, nonce, secret)
   * 2. Sends commitment + proof to relay
   * 3. Relay stores commitment with time-lock (ordering is locked now)
   * 4. Returns queue position and time-lock expiry
   */
  async submitPrivateTx(params: {
    txHash: string;
    senderPubkey: string;
    nonce: string;
  }): Promise<SubmitCommitmentResult> {
    const bundle = createTxCommitment(params.txHash, params.senderPubkey, params.nonce);
    this.txBundles.set(bundle.commitment, bundle);

    const response = await fetch(`${this.relayUrl}/rpc/submit-commitment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commitment: bundle.commitment,
        proofInputs: bundle.proofInputs,
        commitmentType: 'tx',
      }),
    });

    if (!response.ok) {
      const err = (await response.json()) as { error: string; reason?: string };
      throw new Error(`Relay rejected tx commitment: ${err.reason ?? err.error}`);
    }

    return response.json() as Promise<SubmitCommitmentResult>;
  }

  /**
   * Reveal a committed tx after its time-lock expires.
   * The relay verifies the commitment matches txPayload and submits to Starknet.
   */
  async revealTx(commitment: string, txPayload: string): Promise<RevealResult> {
    const response = await fetch(`${this.relayUrl}/rpc/reveal-tx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commitment, txPayload }),
    });

    if (!response.ok) {
      const err = (await response.json()) as { error: string };
      throw new Error(`Reveal failed: ${err.error}`);
    }

    return response.json() as Promise<RevealResult>;
  }

  /**
   * Fetch current queue state from relay.
   */
  async getQueueStatus() {
    const response = await fetch(`${this.relayUrl}/rpc/queue-status`);
    if (!response.ok) throw new Error('Failed to fetch queue status');
    return response.json();
  }

  /** Get locally stored filter bundle by commitment (for re-use). */
  getFilterBundle(commitment: string): FilterProofBundle | undefined {
    return this.filterBundles.get(commitment);
  }

  /** Get locally stored tx bundle by commitment (for reveal). */
  getTxBundle(commitment: string): TxProofBundle | undefined {
    return this.txBundles.get(commitment);
  }
}
