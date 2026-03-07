export type CommitmentType = 'filter' | 'tx';

export interface StoredCommitment {
  commitment: string;
  type: CommitmentType;
  submittedAt: number;
  timeLockExpiry: number;
  revealed: boolean;
  revealedAt?: number;
  txPayload?: string;
  proofInputs: string[];
  position: number;
}

export interface WsMessage {
  type: 'commitment_added' | 'tx_revealed' | 'ping';
  data?: StoredCommitment | Record<string, unknown>;
}
