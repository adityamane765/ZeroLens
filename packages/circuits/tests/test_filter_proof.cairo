use darkindex_circuits::filter_proof::{
    compute_filter_commitment, verify_filter_commitment, verify_filter_proof,
};

// Known test vectors — contract_addr = ETH token on Sepolia, event_key = Transfer selector
const CONTRACT_ADDR: felt252 =
    0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7;
const EVENT_KEY: felt252 = 0x99cd8bde557814842a3121e8ddfd433a539b8c9f14bf31ebf108d12e6196e9;
const USER_SECRET: felt252 = 0xdeadbeef1234567890abcdef;

#[test]
fn test_filter_commitment_valid() {
    let commitment = compute_filter_commitment(CONTRACT_ADDR, EVENT_KEY, USER_SECRET);
    let result = verify_filter_commitment(commitment, CONTRACT_ADDR, EVENT_KEY, USER_SECRET);
    assert(result == true, 'should accept valid commitment');
}

#[test]
fn test_filter_commitment_wrong_secret() {
    let commitment = compute_filter_commitment(CONTRACT_ADDR, EVENT_KEY, USER_SECRET);
    let bad_secret: felt252 = 0xbadcafe;
    let result = verify_filter_commitment(commitment, CONTRACT_ADDR, EVENT_KEY, bad_secret);
    assert(result == false, 'should reject wrong secret');
}

#[test]
fn test_filter_commitment_wrong_address() {
    let commitment = compute_filter_commitment(CONTRACT_ADDR, EVENT_KEY, USER_SECRET);
    let bad_addr: felt252 = 0x1234;
    let result = verify_filter_commitment(commitment, bad_addr, EVENT_KEY, USER_SECRET);
    assert(result == false, 'should reject wrong address');
}

#[test]
fn test_verify_filter_proof_valid() {
    let commitment = compute_filter_commitment(CONTRACT_ADDR, EVENT_KEY, USER_SECRET);
    let proof_inputs: Array<felt252> = array![CONTRACT_ADDR, EVENT_KEY, USER_SECRET];
    let result = verify_filter_proof(commitment, proof_inputs.span());
    assert(result == 1, 'proof should return 1');
}

#[test]
fn test_verify_filter_proof_invalid() {
    let wrong_commitment: felt252 = 0xdeadbeef;
    let proof_inputs: Array<felt252> = array![CONTRACT_ADDR, EVENT_KEY, USER_SECRET];
    let result = verify_filter_proof(wrong_commitment, proof_inputs.span());
    assert(result == 0, 'bad proof should return 0');
}
