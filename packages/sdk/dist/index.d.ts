interface FilterProofBundle {
    commitment: string;
    /** [contract_addr, event_key, user_secret] — the hash preimage */
    proofInputs: [string, string, string];
    userSecret: string;
}
/**
 * Create a filter commitment + proof bundle.
 *
 * commitment = Poseidon(contract_addr, event_key, user_secret)
 *
 * The relay verifies this commitment by recomputing the hash from proofInputs.
 * The relay never learns contract_addr or event_key in plaintext — only the commitment.
 * The user keeps userSecret private and uses it to reconstruct the proof each time.
 */
declare function createFilterCommitment(contractAddr: string, eventKey: string, userSecret?: string): FilterProofBundle;

interface TxProofBundle {
    commitment: string;
    /** [tx_hash, sender_pubkey, nonce, user_secret] — the hash preimage */
    proofInputs: [string, string, string, string];
    userSecret: string;
}
/**
 * Create a tx validity commitment + proof bundle.
 *
 * commitment = Poseidon(tx_hash, sender_pubkey, nonce, user_secret)
 *
 * The relay verifies this by recomputing the hash from proofInputs.
 * The sequencer only sees the commitment until the time-lock expires.
 * After the time-lock, the user reveals the full tx — the relay verifies
 * commitment matches and submits to Starknet in commit-timestamp order.
 */
declare function createTxCommitment(txHash: string, senderPubkey: string, nonce: string, userSecret?: string): TxProofBundle;

interface ZeroLensClientOptions {
    relayUrl: string;
}
interface WatchEventsOptions {
    contractAddr: string;
    eventKey: string;
    fromBlock: number;
    toBlock: number | 'latest';
    chunkSize?: number;
    continuationToken?: string;
}
interface StarknetEvent {
    from_address: string;
    keys: string[];
    data: string[];
    block_number: number;
    transaction_hash: string;
}
interface WatchEventsResult {
    commitment: string;
    events: StarknetEvent[];
    continuation_token?: string;
}
interface SubmitCommitmentResult {
    ok: boolean;
    commitment: string;
    position: number;
    submittedAt: number;
    timeLockExpiry: number;
    revealAfterSeconds: number;
}
interface RevealResult {
    ok: boolean;
    commitment: string;
    position: number;
    revealedAt: number;
    /** Real Starknet tx hash from the sequencer, or null for dry-run. */
    sequencerTxHash: string | null;
    /** Set if the sequencer rejected the tx (ordering still proven). */
    sequencerError?: string;
}
declare class ZeroLensClient {
    private relayUrl;
    private filterBundles;
    private txBundles;
    constructor(options: ZeroLensClientOptions);
    /**
     * Component 1: Private event watching.
     *
     * 1. Creates a filter commitment locally: Poseidon(contractAddr, eventKey, secret)
     * 2. Sends commitment + proof to relay (relay sees ONLY the commitment hash)
     * 3. Relay fetches a broad superset of events from Starknet RPC (no address/key filter)
     * 4. Client filters the superset locally — relay never learns the plaintext filter
     */
    watchEvents(options: WatchEventsOptions): Promise<WatchEventsResult>;
    /**
     * Component 2: Private tx submission.
     *
     * 1. Creates a tx commitment locally: Poseidon(txHash, senderPubkey, nonce, secret)
     * 2. Sends commitment + proof to relay
     * 3. Relay stores commitment with time-lock (ordering is locked now)
     * 4. Returns queue position and time-lock expiry
     */
    submitPrivateTx(params: {
        txHash: string;
        senderPubkey: string;
        nonce: string;
    }): Promise<SubmitCommitmentResult>;
    /**
     * Reveal a committed tx after its time-lock expires.
     * The relay verifies the commitment matches txPayload and submits to Starknet.
     */
    revealTx(commitment: string, txPayload: string): Promise<RevealResult>;
    /**
     * Fetch current queue state from relay.
     */
    getQueueStatus(): Promise<any>;
    /** Get locally stored filter bundle by commitment (for re-use). */
    getFilterBundle(commitment: string): FilterProofBundle | undefined;
    /** Get locally stored tx bundle by commitment (for reveal). */
    getTxBundle(commitment: string): TxProofBundle | undefined;
}

/**
 * Compute a Poseidon commitment from an array of felt252 values.
 * Inputs can be hex strings (0x...) or bigints (converted to hex).
 * Returns commitment as 0x-prefixed hex string.
 *
 * Uses hash.computePoseidonHashOnElements from starknet.js — identical to
 * poseidon_hash_span() in Cairo, so relay verification and circuit spec match exactly.
 */
declare function computeCommitment(inputs: (string | bigint)[]): string;

/**
 * Generate a cryptographically secure secret that fits in a felt252.
 * Starknet felt252 max ≈ 2^251. We use 31 bytes = 248 bits — safely within range.
 * Returns as 0x-prefixed hex string.
 */
declare function generateSecret(): string;

export { type FilterProofBundle, type RevealResult, type StarknetEvent, type SubmitCommitmentResult, type TxProofBundle, type WatchEventsOptions, type WatchEventsResult, ZeroLensClient, type ZeroLensClientOptions, computeCommitment, createFilterCommitment, createTxCommitment, generateSecret };
