# FREE-013 Architecture

FREE-013 establishes a clean `free-testnet-2` ledger in `data/free-chain-testnet-2.json` without rewriting Testnet-1 history. Genesis contains chain state, economic policy, addresses and security epoch. Each subsequent epoch produces a protocol-inflation transaction, updates deterministic state, links to the previous block, commits transaction/state roots, and signs the block payload with a persisted ML-DSA-65 authority key.

Communication identity, node identity, founder economic address and chain authority are separate namespaces. Chain authority has no decryption route into account private keys, Recovery Kits, PINs, messages or vault plaintext.

The browser retains IndexedDB name `free-v01` for identity compatibility. A visible boot fallback prevents silent black-screen startup failures. Static assets use no-store during testnet iteration to reduce stale-code mismatches after Render deploys.

Current chain consensus is deliberately labeled single-authority Genesis Testnet. Multi-validator consensus, block gossip/synchronization, finality/fork-choice, wallet transaction signatures and governance authority separation are next protocol layers, not features claimed by FREE-013.

## Founder Genesis Economic Identity

FREE-013 separates the founder economic identity from user/account identity and node identity. `FOUNDER_GENESIS_SECRET` deterministically derives an ML-DSA-65 keypair; only the public key and `FREE1-GENESIS-*` address are committed to Genesis state. The founder secret/private key is not exposed by the chain API and has no capability to decrypt user data. Inflation rewards target this address by deterministic protocol rule.


## Testnet-2 state conservation
Genesis supply is 500,000,000 FREE. Founder receives 75,000,000 FREE; the remaining 425,000,000 FREE is represented explicitly in a locked Genesis Reserve so the sum of balances equals total supply. Validation rejects a Testnet-2 ledger that violates the 4% issuance ceiling or supply-conservation invariant. If a Testnet-1 file exists, it is read only to create a public continuity reference and is never mutated.

## FREE-022 network/authentication delta
Federation peers now use persistent ML-DSA-65 node credentials. A node ID is derived from its PQ public key, and the federation hello signature binds node ID, version, advertised public URL, public key and advertised local user routes. Node credentials are distinct from Account Identity and Founder/Economic Identity.

Public user identity cards contain public keys only and are persisted by a relay for contact resolution; no user private key is written there. Outgoing message retry stores the already encrypted/signed wire envelope in the sender's local IndexedDB alongside local chat state. Relays still see routing metadata, and federation is not anonymous.


## FREE-022 private-alpha delta
- Unread/read state is local message metadata.
- Read receipts are routed only after browser identity authentication; plaintext remains E2EE.
- Local block list prevents blocked IDs from being accepted by the client.
- Contact removal is a local action and does not mutate another user's identity.
- Mobile chat navigation has an explicit back state.
