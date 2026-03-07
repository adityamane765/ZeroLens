/// Component 2 — Private Mempool Simulator: Tx Validity Commitment Circuit
///
/// This is a hash preimage proof circuit for transaction commitments.
/// The prover demonstrates knowledge of (tx_hash, sender_pubkey, nonce, user_secret)
/// such that Poseidon(tx_hash, sender_pubkey, nonce, user_secret) == commitment,
/// without revealing the actual transaction to the relay until the time-lock expires.
///
/// The commit-reveal flow:
///   1. User computes commitment = Poseidon(tx_hash, sender_pubkey, nonce, secret)
///   2. User sends commitment + proof_inputs to relay (relay verifies hash preimage)
///   3. Relay stores commitment with a time-lock (TIME_LOCK_SECONDS)
///   4. After time-lock, user reveals full tx — relay verifies commitment matches
///   5. Relay (simulated sequencer) submits tx in commit-order, not reveal-order
///
/// This prevents front-running: the sequencer cannot reorder transactions based on
/// content because it only sees the commitment until after ordering is locked.

use core::poseidon::poseidon_hash_span;

/// Computes the tx commitment from the four private inputs.
/// commitment = Poseidon(tx_hash || sender_pubkey || nonce || user_secret)
pub fn compute_tx_commitment(
    tx_hash: felt252, sender_pubkey: felt252, nonce: felt252, user_secret: felt252,
) -> felt252 {
    let mut arr: Array<felt252> = array![tx_hash, sender_pubkey, nonce, user_secret];
    poseidon_hash_span(arr.span())
}

/// Verifies that the given commitment was derived from the provided inputs.
/// Returns true if valid, false otherwise.
pub fn verify_tx_commitment(
    commitment: felt252,
    tx_hash: felt252,
    sender_pubkey: felt252,
    nonce: felt252,
    user_secret: felt252,
) -> bool {
    let computed = compute_tx_commitment(tx_hash, sender_pubkey, nonce, user_secret);
    computed == commitment
}

/// Entry point for relay proof verification.
/// proof_inputs: [tx_hash, sender_pubkey, nonce, user_secret]
/// Returns 1 (felt252) if proof valid, 0 otherwise.
pub fn verify_tx_proof(commitment: felt252, proof_inputs: Span<felt252>) -> felt252 {
    assert(proof_inputs.len() == 4, 'tx: need 4 inputs');
    let valid = verify_tx_commitment(
        commitment,
        *proof_inputs.at(0),
        *proof_inputs.at(1),
        *proof_inputs.at(2),
        *proof_inputs.at(3),
    );
    if valid {
        1
    } else {
        0
    }
}
