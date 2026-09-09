# FREE-011 — Genesis Testnet

FREE is an experimental post-quantum-native private communication protocol and decentralized network. **FREE app ≠ FREE network.** FREE-011 introduces the first native **FREE Chain Genesis Testnet** while preserving the FREE-PQ1 communication path and the rule that user secrets never belong to the chain or founder.

## FREE Chain now exists as a testnet ledger

On first node start, FREE-011 creates and persists `data/free-chain-testnet.json` with a Genesis Block. The chain has SHA-512-derived 256-bit block hashes, previous-block linkage, transaction root, state root, native FREE accounting, security epochs, economic policy, and a persisted ML-DSA-65 validator authority. Blocks after genesis are signed with ML-DSA-65.

The default testnet epoch is 60 seconds so inflation/reward can be observed quickly. Default development policy is 5% annualized inflation, allocating each epoch's new emission: 10% Founder/Developer, 65% Node Pool, 15% Ecosystem, 10% Treasury. These are testnet parameters, not final tokenomics and the token has **no monetary value** in FREE-011.

Founder reward is protocol emission, not an arbitrary admin balance edit. FREE-011 now derives a dedicated **Founder Genesis Economic Identity** from a founder-held secret using a deterministic ML-DSA-65 keypair. Its address format is `FREE1-GENESIS-<40-hex>`, where the suffix is derived from the ML-DSA-65 public key. The secret/private key is never written to chain state or returned by an API. The same `FOUNDER_GENESIS_SECRET` produces the same founder address across redeploys. `/api/founder` exposes only the public founder address, public key and accrued testnet balance; `/api/chain` and `/api/chain/blocks` expose chain state and blocks.

## User privacy boundary

FREE Chain contains no message plaintext, photos, files, Recovery Kits, PINs, account private keys or vault plaintext. Founder/economic/upgrade authority must never imply decryption authority. Account Identity, Node Identity, Payment/Economic Identity and Protocol Authority are separate namespaces.

## UI startup repair

FREE-009 could render a black page when client initialization failed while both onboarding and app shell were hidden. FREE-011 adds a visible boot fallback that remains on screen with an error if initialization fails, and disables one-hour caching for static app assets during the testnet phase. **Do not clear browser site data** while diagnosing an existing identity.

## Post-quantum security

Active communication remains FREE-PQ1: ML-KEM-768, ML-DSA-65, AES-256-GCM and HKDF-SHA-512. FREE Chain testnet block authority uses ML-DSA-65. No RSA/ECDH/ECDSA fallback is added to the active critical path. Crypto-suite/security-epoch versioning is retained so future security migrations are possible.

## What is not claimed yet

FREE-011 is a **Genesis Testnet**, not a production public blockchain. It currently has one authoritative block producer per deployment and does not yet have multi-validator consensus, fork choice, peer block synchronization, transferable user wallets, production Proof of Useful Service, Sybil resistance, signed governance manifests, timelocked upgrades, or a token with monetary value. The founder now has cryptographic custody of the testnet economic identity through `FOUNDER_GENESIS_SECRET`, but transferable wallet transactions are not implemented yet.

## Run

Requires Node.js 20.19+ (Render configuration uses Node 22.16). Run `npm install` then `npm start`. Open `/health`, `/api/chain`, and `/api/chain/blocks?limit=5` for diagnostics. Keep one `README.md`; the living project White Paper is `WHITEPAPER.md`.

## Founder Genesis setup

Before deploying FREE-011, create/store one high-entropy `FOUNDER_GENESIS_SECRET` outside Git and set it as a secret environment variable in Render. Do not change it after Genesis. Run `FOUNDER_GENESIS_SECRET=... npm run founder:address` on a trusted machine to derive the same public address locally. The deployment refuses to start if the secret is missing or too short, preventing accidental genesis with an unstable founder address.
