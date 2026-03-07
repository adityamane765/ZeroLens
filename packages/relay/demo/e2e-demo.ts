/**
 * ZeroLens End-to-End Demo
 *
 * Run with relay already started on port 3001:
 *   npm run dev -w packages/relay
 *
 * Then in another terminal:
 *   npx tsx packages/relay/demo/e2e-demo.ts
 *
 * What it demonstrates:
 *   1. Component 1 — Private event watching (commitment-gated filter, local decryption)
 *   2. Invalid commitment rejection (403)
 *   3. Component 2 — Private tx submission (time-lock commit-reveal)
 *   4. Early reveal rejection (425 Too Early)
 *   5. Reveal after time-lock expires
 *   6. Queue status reflecting final state
 */

import { ZeroLensClient } from '../../sdk/src/ZeroLensClient.js';
import { computeCommitment } from '../../sdk/src/crypto/poseidon.js';

const RELAY_URL = process.env.RELAY_URL ?? 'http://localhost:3001';

// Starknet Sepolia ETH contract + Transfer event key
const ETH_CONTRACT = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';
const TRANSFER_KEY = '0x99cd8bde557814842a3121e8ddfd433a539b8c9f14bf31ebf108d12e6196e9';
const FROM_BLOCK = 700_000;
const TO_BLOCK = 700_050;

// Simulated tx data for Component 2
const TX_HASH = '0x' + 'a'.repeat(63);
const SENDER_PUBKEY = '0x' + 'b'.repeat(63);
const NONCE = '0x1';

function separator(label: string) {
  console.log('\n' + '─'.repeat(60));
  console.log(`  ${label}`);
  console.log('─'.repeat(60));
}

function ok(msg: string) {
  process.stdout.write(`  ✓ ${msg}\n`);
}

function info(msg: string) {
  process.stdout.write(`  · ${msg}\n`);
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function demo() {
  console.log('\nZeroLens — E2E Demo');
  console.log(`Relay: ${RELAY_URL}\n`);

  // ── Health check ──────────────────────────────────────────────
  separator('0. Health check');
  const health = await fetch(`${RELAY_URL}/health`);
  const healthBody = await health.json() as { status: string };
  if (health.status !== 200 || healthBody.status !== 'ok') {
    console.error('  ✗ Relay not healthy — is `npm run dev -w packages/relay` running?');
    process.exit(1);
  }
  ok(`Relay healthy: ${JSON.stringify(healthBody)}`);

  const client = new ZeroLensClient({ relayUrl: RELAY_URL });

  // ── Component 1: Private Event Watching ──────────────────────
  separator('1. Component 1 — Private event watching');
  info(`Contract : ${ETH_CONTRACT}`);
  info(`Event key: ${TRANSFER_KEY}`);
  info(`Blocks   : ${FROM_BLOCK} → ${TO_BLOCK}`);
  info('Creating filter commitment locally (never sent in plaintext)...');

  const result = await client.watchEvents({
    contractAddr: ETH_CONTRACT,
    eventKey: TRANSFER_KEY,
    fromBlock: FROM_BLOCK,
    toBlock: TO_BLOCK,
  });

  ok(`Commitment   : ${result.commitment}`);
  ok(`Events found : ${result.events.length}`);
  if (result.events.length > 0) {
    const e = result.events[0];
    info(`First event  : block ${e.block_number}, tx ${e.transaction_hash.slice(0, 12)}...`);
  }

  // ── Invalid commitment rejection ─────────────────────────────
  separator('2. Invalid commitment rejection');
  info('Sending a tampered commitment (wrong preimage)...');

  const fakeCommitment = computeCommitment(['0xdead', '0xbeef', '0xcafe']);
  const fakeProofInputs = ['0x1111', '0x2222', '0x3333']; // doesn't hash to fakeCommitment

  const badResp = await fetch(`${RELAY_URL}/rpc/private-events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      commitment: fakeCommitment,
      proofInputs: fakeProofInputs,
      fromBlock: FROM_BLOCK,
      toBlock: TO_BLOCK,
    }),
  });
  ok(`Status: ${badResp.status} (expected 403)`);
  const badBody = await badResp.json() as { error: string; reason?: string };
  ok(`Reason: ${badBody.reason ?? badBody.error}`);

  // ── Component 2: Private Tx Submission ───────────────────────
  separator('3. Component 2 — Submit private tx commitment');
  info(`tx_hash     : ${TX_HASH.slice(0, 12)}...`);
  info(`sender_pubkey: ${SENDER_PUBKEY.slice(0, 12)}...`);
  info(`nonce       : ${NONCE}`);

  const submitResult = await client.submitPrivateTx({
    txHash: TX_HASH,
    senderPubkey: SENDER_PUBKEY,
    nonce: NONCE,
  });

  ok(`Commitment     : ${submitResult.commitment}`);
  ok(`Queue position : ${submitResult.position}`);
  ok(`Time-lock expiry: ${new Date(submitResult.timeLockExpiry).toISOString()}`);
  info(`Reveal allowed in ~${submitResult.revealAfterSeconds}s`);

  // ── Early reveal rejection ────────────────────────────────────
  separator('4. Early reveal rejection (time-lock active)');
  info('Attempting to reveal immediately...');

  try {
    await client.revealTx(submitResult.commitment, JSON.stringify({ simulated: true }));
    console.error('  ✗ Expected reveal to fail — time-lock should be active');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    ok(`Reveal rejected as expected: ${msg}`);
  }

  // ── Wait for time-lock ────────────────────────────────────────
  const remaining = Math.max(0, submitResult.timeLockExpiry - Date.now());
  separator(`5. Waiting ${Math.ceil(remaining / 1000)}s for time-lock to expire...`);

  const TICK = 1000;
  let waited = 0;
  while (waited < remaining) {
    const left = Math.ceil((remaining - waited) / 1000);
    process.stdout.write(`\r  ⏳ ${left}s remaining...`);
    await wait(TICK);
    waited += TICK;
  }
  process.stdout.write('\r  ✓ Time-lock expired!               \n');

  // ── Successful reveal ─────────────────────────────────────────
  separator('6. Reveal tx after time-lock');
  const revealResult = await client.revealTx(
    submitResult.commitment,
    JSON.stringify({ tx_hash: TX_HASH, sender: SENDER_PUBKEY, nonce: NONCE }),
  );

  ok(`Revealed  : ${revealResult.ok}`);
  ok(`Position  : ${revealResult.position}`);
  ok(`Revealed at: ${new Date(revealResult.revealedAt).toISOString()}`);
  ok(`Simulated : ${revealResult.simulated}`);

  // ── Queue status ──────────────────────────────────────────────
  separator('7. Final queue status');
  const status = await client.getQueueStatus() as {
    pending: unknown[];
    revealed: unknown[];
    stats: { total: number; pending: number; revealed: number };
  };
  ok(`Total     : ${status.stats.total}`);
  ok(`Pending   : ${status.stats.pending}`);
  ok(`Revealed  : ${status.stats.revealed}`);

  console.log('\n' + '─'.repeat(60));
  console.log('  ZeroLens demo complete.');
  console.log('─'.repeat(60) + '\n');
}

demo().catch((err) => {
  console.error('\nDemo failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
