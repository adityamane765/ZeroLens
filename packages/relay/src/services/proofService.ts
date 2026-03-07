import { hash } from 'starknet';

export interface ProofResult {
  valid: boolean;
  reason?: string;
}

/**
 * Verifies a filter proof (hash preimage).
 * proofInputs = [contract_addr, event_key, user_secret]
 * Valid if Poseidon(proofInputs) === commitment.
 *
 * JS equivalent of verify_filter_proof() in packages/circuits/src/filter_proof.cairo.
 */
export function verifyFilterProof(
  commitment: string,
  proofInputs: string[],
): ProofResult {
  if (proofInputs.length !== 3) {
    return { valid: false, reason: 'filter proof requires exactly 3 inputs' };
  }
  try {
    const computed = hash.computePoseidonHashOnElements(proofInputs);
    if (computed.toLowerCase() === commitment.toLowerCase()) return { valid: true };
    return { valid: false, reason: 'commitment mismatch' };
  } catch (e) {
    return { valid: false, reason: `hash error: ${(e as Error).message}` };
  }
}

/**
 * Verifies a tx validity proof (hash preimage).
 * proofInputs = [tx_hash, sender_pubkey, nonce, user_secret]
 * Valid if Poseidon(proofInputs) === commitment.
 *
 * JS equivalent of verify_tx_proof() in packages/circuits/src/tx_validity_proof.cairo.
 */
export function verifyTxProof(
  commitment: string,
  proofInputs: string[],
): ProofResult {
  if (proofInputs.length !== 4) {
    return { valid: false, reason: 'tx proof requires exactly 4 inputs' };
  }
  try {
    const computed = hash.computePoseidonHashOnElements(proofInputs);
    if (computed.toLowerCase() === commitment.toLowerCase()) return { valid: true };
    return { valid: false, reason: 'commitment mismatch' };
  } catch (e) {
    return { valid: false, reason: `hash error: ${(e as Error).message}` };
  }
}
