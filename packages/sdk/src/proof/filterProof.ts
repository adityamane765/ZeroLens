import { computeCommitment } from '../crypto/poseidon.js';
import { generateSecret } from '../crypto/secret.js';

export interface FilterProofBundle {
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
export function createFilterCommitment(
  contractAddr: string,
  eventKey: string,
  userSecret?: string,
): FilterProofBundle {
  const secret = userSecret ?? generateSecret();
  const commitment = computeCommitment([contractAddr, eventKey, secret]);
  return {
    commitment,
    proofInputs: [contractAddr, eventKey, secret],
    userSecret: secret,
  };
}
