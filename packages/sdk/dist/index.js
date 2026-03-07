"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// packages/sdk/src/index.ts
var index_exports = {};
__export(index_exports, {
  ZeroLensClient: () => ZeroLensClient,
  computeCommitment: () => computeCommitment,
  createFilterCommitment: () => createFilterCommitment,
  createTxCommitment: () => createTxCommitment,
  generateSecret: () => generateSecret
});
module.exports = __toCommonJS(index_exports);

// packages/sdk/src/crypto/poseidon.ts
var import_starknet = require("starknet");
function computeCommitment(inputs) {
  const hexInputs = inputs.map(
    (x) => typeof x === "bigint" ? "0x" + x.toString(16) : x
  );
  return import_starknet.hash.computePoseidonHashOnElements(hexInputs);
}

// packages/sdk/src/crypto/secret.ts
var import_crypto = require("crypto");
function generateSecret() {
  const bytes = (0, import_crypto.randomBytes)(31);
  return "0x" + Buffer.from(bytes).toString("hex");
}

// packages/sdk/src/proof/filterProof.ts
function createFilterCommitment(contractAddr, eventKey, userSecret) {
  const secret = userSecret ?? generateSecret();
  const commitment = computeCommitment([contractAddr, eventKey, secret]);
  return {
    commitment,
    proofInputs: [contractAddr, eventKey, secret],
    userSecret: secret
  };
}

// packages/sdk/src/proof/txValidityProof.ts
function createTxCommitment(txHash, senderPubkey, nonce, userSecret) {
  const secret = userSecret ?? generateSecret();
  const commitment = computeCommitment([txHash, senderPubkey, nonce, secret]);
  return {
    commitment,
    proofInputs: [txHash, senderPubkey, nonce, secret],
    userSecret: secret
  };
}

// packages/sdk/src/ZeroLensClient.ts
var ZeroLensClient = class {
  relayUrl;
  filterBundles = /* @__PURE__ */ new Map();
  txBundles = /* @__PURE__ */ new Map();
  constructor(options) {
    this.relayUrl = options.relayUrl.replace(/\/$/, "");
  }
  /**
   * Component 1: Private event watching.
   *
   * 1. Creates a filter commitment locally: Poseidon(contractAddr, eventKey, secret)
   * 2. Sends commitment + proof to relay (relay sees ONLY the commitment hash)
   * 3. Relay fetches a broad superset of events from Starknet RPC (no address/key filter)
   * 4. Client filters the superset locally — relay never learns the plaintext filter
   */
  async watchEvents(options) {
    const bundle = createFilterCommitment(options.contractAddr, options.eventKey);
    this.filterBundles.set(bundle.commitment, bundle);
    const response = await fetch(`${this.relayUrl}/rpc/private-events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        commitment: bundle.commitment,
        proofInputs: bundle.proofInputs,
        fromBlock: options.fromBlock,
        toBlock: options.toBlock,
        chunkSize: options.chunkSize ?? 200,
        continuationToken: options.continuationToken
      })
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(`Relay rejected proof: ${err.reason ?? err.error}`);
    }
    const data = await response.json();
    const norm = (s) => "0x" + s.toLowerCase().replace(/^0x0*/, "");
    const rawAddr = options.contractAddr.trim();
    const targetAddr = rawAddr ? norm(rawAddr) : null;
    const targetKey = norm(options.eventKey);
    const filtered = data.events.filter(
      (event) => (!targetAddr || norm(event.from_address) === targetAddr) && norm(event.keys[0] ?? "") === targetKey
    );
    return {
      commitment: bundle.commitment,
      events: filtered,
      continuation_token: data.continuation_token
    };
  }
  /**
   * Component 2: Private tx submission.
   *
   * 1. Creates a tx commitment locally: Poseidon(txHash, senderPubkey, nonce, secret)
   * 2. Sends commitment + proof to relay
   * 3. Relay stores commitment with time-lock (ordering is locked now)
   * 4. Returns queue position and time-lock expiry
   */
  async submitPrivateTx(params) {
    const bundle = createTxCommitment(params.txHash, params.senderPubkey, params.nonce);
    this.txBundles.set(bundle.commitment, bundle);
    const response = await fetch(`${this.relayUrl}/rpc/submit-commitment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        commitment: bundle.commitment,
        proofInputs: bundle.proofInputs,
        commitmentType: "tx"
      })
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(`Relay rejected tx commitment: ${err.reason ?? err.error}`);
    }
    return response.json();
  }
  /**
   * Reveal a committed tx after its time-lock expires.
   * The relay verifies the commitment matches txPayload and submits to Starknet.
   */
  async revealTx(commitment, txPayload) {
    const response = await fetch(`${this.relayUrl}/rpc/reveal-tx`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commitment, txPayload })
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(`Reveal failed: ${err.error}`);
    }
    return response.json();
  }
  /**
   * Fetch current queue state from relay.
   */
  async getQueueStatus() {
    const response = await fetch(`${this.relayUrl}/rpc/queue-status`);
    if (!response.ok) throw new Error("Failed to fetch queue status");
    return response.json();
  }
  /** Get locally stored filter bundle by commitment (for re-use). */
  getFilterBundle(commitment) {
    return this.filterBundles.get(commitment);
  }
  /** Get locally stored tx bundle by commitment (for reveal). */
  getTxBundle(commitment) {
    return this.txBundles.get(commitment);
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ZeroLensClient,
  computeCommitment,
  createFilterCommitment,
  createTxCommitment,
  generateSecret
});
