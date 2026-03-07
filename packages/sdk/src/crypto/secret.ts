import { randomBytes } from 'crypto';

/**
 * Generate a cryptographically secure secret that fits in a felt252.
 * Starknet felt252 max ≈ 2^251. We use 31 bytes = 248 bits — safely within range.
 * Returns as 0x-prefixed hex string.
 */
export function generateSecret(): string {
  const bytes = randomBytes(31);
  return '0x' + Buffer.from(bytes).toString('hex');
}
