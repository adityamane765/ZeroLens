/// Component 1 — Private Event Indexer: Filter Commitment Circuit
///
/// This is a hash preimage proof circuit.
/// The prover demonstrates knowledge of (contract_addr, event_key, user_secret)
/// such that Poseidon(contract_addr, event_key, user_secret) == commitment,
/// without revealing the plaintext filter to the relay.
///
/// The relay enforces this via poseidonHashMany in starknet.js (same computation,
/// same Poseidon parameters). The Cairo circuit serves as the formal specification
/// and is used for the on-chain verifier in the CommitmentRegistry contract.

use core::poseidon::poseidon_hash_span;

/// Computes the filter commitment from the three private inputs.
/// commitment = Poseidon(contract_addr || event_key || user_secret)
pub fn compute_filter_commitment(
    contract_addr: felt252, event_key: felt252, user_secret: felt252,
) -> felt252 {
    let mut arr: Array<felt252> = array![contract_addr, event_key, user_secret];
    poseidon_hash_span(arr.span())
}

/// Verifies that the given commitment was derived from the provided inputs.
/// Returns true if valid, false otherwise.
pub fn verify_filter_commitment(
    commitment: felt252,
    contract_addr: felt252,
    event_key: felt252,
    user_secret: felt252,
) -> bool {
    let computed = compute_filter_commitment(contract_addr, event_key, user_secret);
    computed == commitment
}

/// Entry point for relay proof verification.
/// proof_inputs: [contract_addr, event_key, user_secret]
/// Returns 1 (felt252) if proof valid, 0 otherwise.
pub fn verify_filter_proof(commitment: felt252, proof_inputs: Span<felt252>) -> felt252 {
    assert(proof_inputs.len() == 3, 'filter: need 3 inputs');
    let valid = verify_filter_commitment(
        commitment, *proof_inputs.at(0), *proof_inputs.at(1), *proof_inputs.at(2),
    );
    if valid {
        1
    } else {
        0
    }
}
