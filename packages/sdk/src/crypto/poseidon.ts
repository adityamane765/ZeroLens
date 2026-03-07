import { hash } from 'starknet';

/**
 * Compute a Poseidon commitment from an array of felt252 values.
 * Inputs can be hex strings (0x...) or bigints (converted to hex).
 * Returns commitment as 0x-prefixed hex string.
 *
 * Uses hash.computePoseidonHashOnElements from starknet.js — identical to
 * poseidon_hash_span() in Cairo, so relay verification and circuit spec match exactly.
 */
export function computeCommitment(inputs: (string | bigint)[]): string {
  const hexInputs = inputs.map((x) =>
    typeof x === 'bigint' ? '0x' + x.toString(16) : x,
  );
  return hash.computePoseidonHashOnElements(hexInputs);
}
