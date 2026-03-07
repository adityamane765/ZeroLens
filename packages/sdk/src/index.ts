export { ZeroLensClient } from './ZeroLensClient.js';
export { computeCommitment } from './crypto/poseidon.js';
export { generateSecret } from './crypto/secret.js';
export { createFilterCommitment } from './proof/filterProof.js';
export { createTxCommitment } from './proof/txValidityProof.js';
export type {
  ZeroLensClientOptions,
  WatchEventsOptions,
  StarknetEvent,
  WatchEventsResult,
  SubmitCommitmentResult,
  RevealResult,
} from './ZeroLensClient.js';
export type { FilterProofBundle } from './proof/filterProof.js';
export type { TxProofBundle } from './proof/txValidityProof.js';
