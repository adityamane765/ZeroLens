import type { CommitmentType, StoredCommitment } from '../types/index.js';

class CommitmentStore {
  private store = new Map<string, StoredCommitment>();
  private counter = 0;

  add(
    commitment: string,
    type: CommitmentType,
    proofInputs: string[],
    timeLockSeconds: number,
  ): StoredCommitment {
    const now = Date.now();
    const entry: StoredCommitment = {
      commitment,
      type,
      submittedAt: now,
      timeLockExpiry: now + timeLockSeconds * 1000,
      revealed: false,
      proofInputs,
      position: ++this.counter,
    };
    this.store.set(commitment, entry);
    return entry;
  }

  get(commitment: string): StoredCommitment | undefined {
    return this.store.get(commitment);
  }

  reveal(commitment: string, txPayload: string): StoredCommitment {
    const entry = this.store.get(commitment);
    if (!entry) throw new Error('commitment not found');
    if (entry.revealed) throw new Error('already revealed');

    const remaining = entry.timeLockExpiry - Date.now();
    if (remaining > 0) {
      throw new Error(`time-lock active: ${Math.ceil(remaining / 1000)}s remaining`);
    }

    entry.revealed = true;
    entry.revealedAt = Date.now();
    entry.txPayload = txPayload;
    this.store.set(commitment, entry);
    return entry;
  }

  listPending(): StoredCommitment[] {
    return [...this.store.values()]
      .filter((e) => !e.revealed)
      .sort((a, b) => a.position - b.position);
  }

  listRevealed(): StoredCommitment[] {
    return [...this.store.values()]
      .filter((e) => e.revealed)
      .sort((a, b) => (a.revealedAt ?? 0) - (b.revealedAt ?? 0));
  }

  size(): number {
    return this.store.size;
  }
}

// Singleton shared across all routes
export const commitmentStore = new CommitmentStore();
