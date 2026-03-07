import { z } from 'zod';

const ConfigSchema = z.object({
  PORT: z.string().default('3001'),
  STARKNET_RPC_URL: z.string().url(),
  COMMITMENT_REGISTRY_ADDRESS: z.string().startsWith('0x'),
  TIME_LOCK_SECONDS: z.coerce.number().default(30),
  PROOF_MODE: z.enum(['hash_preimage', 'stub']).default('hash_preimage'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
});

export type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(): Config {
  return ConfigSchema.parse(process.env);
}

export const config = loadConfig();
