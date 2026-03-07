use darkindex_circuits::tx_validity_proof::{
    compute_tx_commitment, verify_tx_commitment, verify_tx_proof,
};

const TX_HASH: felt252 = 0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef;
const SENDER_PUBKEY: felt252 = 0x04a5e1b15ceecf0a44e7c2e0d3e6f9b8a7c6d5e4f3a2b1c0d9e8f7a6b5c4d3;
const NONCE: felt252 = 0x5;
const USER_SECRET: felt252 = 0xcafe0000babe1111dead2222beef3333;

#[test]
fn test_tx_commitment_valid() {
    let commitment = compute_tx_commitment(TX_HASH, SENDER_PUBKEY, NONCE, USER_SECRET);
    let result = verify_tx_commitment(commitment, TX_HASH, SENDER_PUBKEY, NONCE, USER_SECRET);
    assert(result == true, 'valid tx commitment');
}

#[test]
fn test_tx_commitment_wrong_secret() {
    let commitment = compute_tx_commitment(TX_HASH, SENDER_PUBKEY, NONCE, USER_SECRET);
    let bad_secret: felt252 = 0x1;
    let result = verify_tx_commitment(commitment, TX_HASH, SENDER_PUBKEY, NONCE, bad_secret);
    assert(result == false, 'should reject wrong secret');
}

#[test]
fn test_tx_commitment_wrong_nonce() {
    let commitment = compute_tx_commitment(TX_HASH, SENDER_PUBKEY, NONCE, USER_SECRET);
    let bad_nonce: felt252 = 0x99;
    let result = verify_tx_commitment(commitment, TX_HASH, SENDER_PUBKEY, bad_nonce, USER_SECRET);
    assert(result == false, 'should reject wrong nonce');
}

#[test]
fn test_verify_tx_proof_valid() {
    let commitment = compute_tx_commitment(TX_HASH, SENDER_PUBKEY, NONCE, USER_SECRET);
    let proof_inputs: Array<felt252> = array![TX_HASH, SENDER_PUBKEY, NONCE, USER_SECRET];
    let result = verify_tx_proof(commitment, proof_inputs.span());
    assert(result == 1, 'valid tx proof should return 1');
}

#[test]
fn test_verify_tx_proof_invalid() {
    let wrong_commitment: felt252 = 0xdeadbeef;
    let proof_inputs: Array<felt252> = array![TX_HASH, SENDER_PUBKEY, NONCE, USER_SECRET];
    let result = verify_tx_proof(wrong_commitment, proof_inputs.span());
    assert(result == 0, 'bad tx proof should return 0');
}
