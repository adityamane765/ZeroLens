// (base) adityamane@Adityas-MacBook-Air-2 contracts % STARKNET_PRIVATE_KEY=0x06b7ff3c4ec33327e3ba9ee3cd56fe25e512cb5ddd0775f401122066031776ef \
// ACCOUNT_ADDRESS=0x014e451782618d2b0090517d2a03710391970e568113f04977b9ca8a6efe55f0 \
// /opt/homebrew/bin/node deploy.mjs
// RPC: https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/cf52O0RwFy1mEB0uoYsel
// Latest block: 7007637
// Using account: 0x014e451782618d2b0090517d2a03710391970e568113f04977b9ca8a6efe55f0

// Declaring CommitmentRegistry...
// Class hash: 0x4fc8cdd23c609b64b94599877eed0594edc9171568bb8a18d52e16119f374b4
// [2026-02-28T02:43:23.108Z] INFO: txLife: 
// [
//   "RECEIVED"
// ]
// [2026-02-28T02:43:28.949Z] INFO: txLife: 
// [
//   "RECEIVED"
// ]
// Declared!

// Deploying instance...
// [2026-02-28T02:43:41.458Z] WARN: Insufficient transaction data: found 1 V3 transactions with tips in 3 blocks (block range: 7007652-7007654). Required: 10 transactions. Consider reducing minTxsNecessary or increasing maxBlocks.
// Deploy tx: 0x7a74db07843771264e4dec8037c5be0f6c83bba3ab494393ef52c9201f64fc5

// ✓ Deployed!
// Contract address: 0x55c0dcf42fdeb593d140395e8b8e4a1bf0f2daf3cac29eadfac591a0cc77bef
// Updated packages/relay/.env

// Voyager: https://sepolia.voyager.online/contract/0x55c0dcf42fdeb593d140395e8b8e4a1bf0f2daf3cac29eadfac591a0cc77bef
// (base) adityamane@Adityas-MacBook-Air-2 contracts % 

import { RpcProvider, Account, json } from './node_modules/starknet/dist/index.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const RPC_URL = 'https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/cf52O0RwFy1mEB0uoYsel';
const PRIVATE_KEY = process.env.STARKNET_PRIVATE_KEY;
const ACCOUNT_ADDRESS = process.env.ACCOUNT_ADDRESS;

if (!PRIVATE_KEY || !ACCOUNT_ADDRESS) {
  console.error('Usage: STARKNET_PRIVATE_KEY=0x... ACCOUNT_ADDRESS=0x... node deploy.mjs');
  process.exit(1);
}

const CONTRACT_DIR = resolve(__dirname, 'target/dev');
const SIERRA_FILE = resolve(CONTRACT_DIR, 'darkindex_contracts_CommitmentRegistry.contract_class.json');
const CASM_FILE   = resolve(CONTRACT_DIR, 'darkindex_contracts_CommitmentRegistry.compiled_contract_class.json');
const RELAY_ENV   = resolve(__dirname, '../relay/.env');

async function main() {
  console.log('RPC:', RPC_URL);
  const provider = new RpcProvider({ nodeUrl: RPC_URL, blockIdentifier: 'latest' });

  const block = await provider.getBlockLatestAccepted();
  console.log('Latest block:', block.block_number);

  const sierra = json.parse(readFileSync(SIERRA_FILE).toString('ascii'));
  const casm   = json.parse(readFileSync(CASM_FILE).toString('ascii'));

  const account = new Account({ provider, address: ACCOUNT_ADDRESS, signer: PRIVATE_KEY });
  console.log('Using account:', ACCOUNT_ADDRESS);

  // Declare
  console.log('\nDeclaring CommitmentRegistry...');
  const declareResponse = await account.declare({ contract: sierra, casm });
  console.log('Class hash:', declareResponse.class_hash);
  await provider.waitForTransaction(declareResponse.transaction_hash);
  console.log('Declared!');

  // Deploy instance
  console.log('\nDeploying instance...');
  const deployResponse = await account.deploy({
    classHash: declareResponse.class_hash,
  });
  console.log('Deploy tx:', deployResponse.transaction_hash);
  await provider.waitForTransaction(deployResponse.transaction_hash);

  const contractAddress = deployResponse.contract_address[0] ?? deployResponse.contract_address;
  console.log('\n✓ Deployed!');
  console.log('Contract address:', contractAddress);

  if (existsSync(RELAY_ENV)) {
    let env = readFileSync(RELAY_ENV, 'utf8');
    env = env.replace(/COMMITMENT_REGISTRY_ADDRESS=.*/, `COMMITMENT_REGISTRY_ADDRESS=${contractAddress}`);
    writeFileSync(RELAY_ENV, env);
    console.log('Updated packages/relay/.env');
  }

  console.log('\nVoyager: https://sepolia.voyager.online/contract/' + contractAddress);
}

main().catch(err => {
  console.error('\nFailed:', err.message ?? err);
  process.exit(1);
});
