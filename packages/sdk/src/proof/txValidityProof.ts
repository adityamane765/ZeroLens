import { computeCommitment } from '../crypto/poseidon.js';
import { generateSecret } from '../crypto/secret.js';

export interface TxProofBundle {
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
export function createTxCommitment(
  txHash: string,
  senderPubkey: string,
  nonce: string,
  userSecret?: string,
): TxProofBundle {
  const secret = userSecret ?? generateSecret();
  const commitment = computeCommitment([txHash, senderPubkey, nonce, secret]);
  return {
    commitment,
    proofInputs: [txHash, senderPubkey, nonce, secret],
    userSecret: secret,
  };
}
