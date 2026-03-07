use starknet::ContractAddress;

#[derive(Drop, Copy, Serde, starknet::Store)]
pub struct CommitmentEntry {
    pub caller: ContractAddress,
    pub timestamp: u64,
    pub revealed: bool,
    pub commitment_type: u8, // 0 = filter, 1 = tx
}

#[starknet::interface]
pub trait ICommitmentRegistry<TContractState> {
    fn register_commitment(
        ref self: TContractState, commitment: felt252, commitment_type: u8,
    );
    fn verify_proof(
        ref self: TContractState, commitment: felt252, proof_inputs: Span<felt252>,
    ) -> bool;
    fn reveal_tx(ref self: TContractState, commitment: felt252);
    fn get_commitment_entry(self: @TContractState, commitment: felt252) -> CommitmentEntry;
    fn get_commitment_count(self: @TContractState) -> u64;
    fn is_commitment_registered(self: @TContractState, commitment: felt252) -> bool;
}

#[starknet::contract]
pub mod CommitmentRegistry {
    use starknet::{ContractAddress, get_caller_address, get_block_timestamp};
    use starknet::storage::{
        StoragePointerReadAccess, StoragePointerWriteAccess, StorageMapReadAccess,
        StorageMapWriteAccess, Map,
    };
    use core::poseidon::poseidon_hash_span;
    use super::{CommitmentEntry, ICommitmentRegistry};

    #[storage]
    struct Storage {
        commitments: Map<felt252, CommitmentEntry>,
        commitment_count: u64,
        commitment_index: Map<u64, felt252>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        CommitmentRegistered: CommitmentRegistered,
        TxRevealed: TxRevealed,
        ProofVerified: ProofVerified,
    }

    #[derive(Drop, starknet::Event)]
    pub struct CommitmentRegistered {
        #[key]
        pub commitment: felt252,
        #[key]
        pub caller: ContractAddress,
        pub timestamp: u64,
        pub commitment_type: u8,
    }

    #[derive(Drop, starknet::Event)]
    pub struct TxRevealed {
        #[key]
        pub commitment: felt252,
        pub caller: ContractAddress,
        pub reveal_timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct ProofVerified {
        #[key]
        pub commitment: felt252,
        pub valid: bool,
    }

    #[abi(embed_v0)]
    impl CommitmentRegistryImpl of ICommitmentRegistry<ContractState> {
        /// Register a new commitment. Bound to the caller address.
        fn register_commitment(
            ref self: ContractState, commitment: felt252, commitment_type: u8,
        ) {
            let caller = get_caller_address();
            let timestamp = get_block_timestamp();
            let entry = CommitmentEntry {
                caller, timestamp, revealed: false, commitment_type,
            };
            self.commitments.write(commitment, entry);
            let idx = self.commitment_count.read();
            self.commitment_index.write(idx, commitment);
            self.commitment_count.write(idx + 1);
            self.emit(CommitmentRegistered { commitment, caller, timestamp, commitment_type });
        }

        /// On-chain proof verification: poseidon_hash_span(proof_inputs) == commitment.
        fn verify_proof(
            ref self: ContractState, commitment: felt252, proof_inputs: Span<felt252>,
        ) -> bool {
            let computed = poseidon_hash_span(proof_inputs);
            let valid = computed == commitment;
            self.emit(ProofVerified { commitment, valid });
            valid
        }

        /// Mark a tx commitment as revealed. Only the original committer can call this.
        fn reveal_tx(ref self: ContractState, commitment: felt252) {
            let caller = get_caller_address();
            let entry = self.commitments.read(commitment);
            assert(!entry.revealed, 'already revealed');
            assert(entry.caller == caller, 'not commitment owner');
            let updated = CommitmentEntry {
                caller: entry.caller,
                timestamp: entry.timestamp,
                revealed: true,
                commitment_type: entry.commitment_type,
            };
            self.commitments.write(commitment, updated);
            self.emit(TxRevealed {
                commitment, caller, reveal_timestamp: get_block_timestamp(),
            });
        }

        fn get_commitment_entry(
            self: @ContractState, commitment: felt252,
        ) -> CommitmentEntry {
            self.commitments.read(commitment)
        }

        fn get_commitment_count(self: @ContractState) -> u64 {
            self.commitment_count.read()
        }

        fn is_commitment_registered(self: @ContractState, commitment: felt252) -> bool {
            let entry = self.commitments.read(commitment);
            entry.timestamp != 0
        }
    }
}
