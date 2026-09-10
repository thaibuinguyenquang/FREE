# FREE-024 — Private Alpha Messenger

FREE is an experimental post-quantum-native private communication protocol and decentralized network. **FREE app ≠ FREE network.** FREE-023 advances the usable post-quantum messenger while preserving **FREE Chain Freedom Economy Testnet-2** while preserving the FREE-PQ1 communication path and the rule that user secrets never belong to the chain or founder.

## FREE Chain now exists as a testnet ledger

On first node start, FREE-013 creates and persists `data/free-chain-testnet-2.json` with a Genesis Block. The chain has SHA-512-derived 256-bit block hashes, previous-block linkage, transaction root, state root, native FREE accounting, security epochs, economic policy, and a persisted ML-DSA-65 validator authority. Blocks after genesis are signed with ML-DSA-65.

The default testnet epoch is 60 seconds for observable testing. FREE-013 changes the economic baseline to **500,000,000 FREE at Genesis**, assigns **15% (75,000,000 FREE) to the Founder Genesis Economic Identity**, sets a default gross issuance target of **2.5% annualized**, and enforces a **4% hard ceiling**. Future emission remains 10% Founder/Development, 65% Node Pool, 15% Ecosystem and 10% Treasury. Burn accounting is present, while real fee charging/burning remains roadmap work. FREE-013 testnet units have **no monetary value**.

Founder reward is protocol emission, not an arbitrary admin balance edit. FREE-013 now derives a dedicated **Founder Genesis Economic Identity** from a founder-held secret using a deterministic ML-DSA-65 keypair. Its address format is `FREE1-GENESIS-<40-hex>`, where the suffix is derived from the ML-DSA-65 public key. The secret/private key is never written to chain state or returned by an API. The same `FOUNDER_GENESIS_SECRET` produces the same founder address across redeploys. `/api/founder` exposes only the public founder address, public key and accrued testnet balance; `/api/chain` and `/api/chain/blocks` expose chain state and blocks.

## User privacy boundary

FREE Chain contains no message plaintext, photos, files, Recovery Kits, PINs, account private keys or vault plaintext. Founder/economic/upgrade authority must never imply decryption authority. Account Identity, Node Identity, Payment/Economic Identity and Protocol Authority are separate namespaces.

## UI startup repair

FREE-009 could render a black page when client initialization failed while both onboarding and app shell were hidden. FREE-013 adds a visible boot fallback that remains on screen with an error if initialization fails, and disables one-hour caching for static app assets during the testnet phase. **Do not clear browser site data** while diagnosing an existing identity.

## Post-quantum security

Active communication remains FREE-PQ1: ML-KEM-768, ML-DSA-65, AES-256-GCM and HKDF-SHA-512. FREE Chain testnet block authority uses ML-DSA-65. No RSA/ECDH/ECDSA fallback is added to the active critical path. Crypto-suite/security-epoch versioning is retained so future security migrations are possible.

## What is not claimed yet

FREE-013 is a **Genesis Testnet**, not a production public blockchain. It currently has one authoritative block producer per deployment and does not yet have multi-validator consensus, fork choice, peer block synchronization, transferable user wallets, production Proof of Useful Service, Sybil resistance, signed governance manifests, timelocked upgrades, or a token with monetary value. The founder now has cryptographic custody of the testnet economic identity through `FOUNDER_GENESIS_SECRET`, but transferable wallet transactions are not implemented yet.

## Run

Requires Node.js 20.19+ (Render configuration uses Node 22.16). Run `npm install` then `npm start`. Open `/health`, `/api/chain`, and `/api/chain/blocks?limit=5` for diagnostics. Keep one `README.md`; the living project White Paper is `WHITEPAPER.md`.

## Founder Genesis setup

Before deploying FREE-013, create/store one high-entropy `FOUNDER_GENESIS_SECRET` outside Git and set it as a secret environment variable in Render. Do not change it after Genesis. Run `FOUNDER_GENESIS_SECRET=... npm run founder:address` on a trusted machine to derive the same public address locally. The deployment refuses to start if the secret is missing or too short, preventing accidental genesis with an unstable founder address.

## Testnet-2 Genesis migration rule

FREE-013 intentionally creates `free-testnet-2` instead of editing the historical FREE-011/012 Testnet-1 Genesis. The old Testnet-1 ledger, when present, is treated as read-only history. Testnet-2 may record the old chain ID, Genesis hash, latest hash and height as a continuity reference, but no Testnet-1 block or balance is imported as authoritative state.

The 500,000,000 FREE Genesis supply is fully conserved in balances: 75,000,000 belongs to the Founder Genesis Economic Identity and the remaining 425,000,000 sits in a locked **Genesis Reserve**. That reserve is intentionally unallocated until simulation determines a defensible mainnet distribution; it is not Founder property. This avoids pretending that undecided Node/Ecosystem/Treasury/Community percentages are already final tokenomics.

## FREE-023
FREE-023 focuses on a usable post-quantum messenger and the foundation for independently operated FREE nodes. It preserves FREE-013 Testnet-2 economics: 500,000,000 FREE Genesis supply, 75,000,000 FREE Founder Genesis allocation, 2.5% default gross issuance, 4% hard ceiling, and burn accounting without claiming fee burn is implemented.

Changes in this version include persistent public PQ contact cards, reconnect retry for locally retained encrypted outgoing envelopes, and ML-DSA-65-authenticated federation node handshakes with node IDs derived from PQ public keys. These features do not yet make FREE a production decentralized blockchain: validator consensus, Sybil resistance, production metadata privacy, a production PQ ratchet, and audited security remain future work.

### Messenger-first UX in FREE-023
The default product surface is now Chats / People / Network / Settings. Chain, node accounting, storage contribution and cryptographic implementation details are removed from the everyday chat surface and placed behind Network/Settings. Onboarding transitions to the app at the top of the viewport instead of continuing as a long scrolling technical page. PQ relay authentication now allows a longer startup window and remains visibly fail-closed rather than pretending a timed-out session is connected.


## FREE-023 reliability milestone
- Account Recovery now validates the Recovery Kit, restores state in place, and enters Messenger without a reload.
- Browser client transport now uses the maintained `ws` WebSocket implementation on the server instead of a hand-written WebSocket frame parser.
- PQ login remains fail-closed: a client is marked connected only after ML-DSA-65 challenge verification succeeds.
- Reconnect/auth timeouts are explicit and recover automatically; `/health` exposes `clientAuth` and `clientWebSocket` for deployment verification.
- Testnet-2 economics and Founder Genesis allocation are unchanged.


## FREE-023 restore/auth fix
- Fixes browser WebSocket rejection caused by the missing same-origin validator.
- Restore now cleanly replaces onboarding with Messenger instead of rendering both states.
- Restored display name and Short FREE ID are shown in the Messenger header.
- No identity, Founder Genesis secret, Testnet-2 genesis, or tokenomics reset.


## FREE-023 private-alpha essentials

FREE-023 is the first version explicitly shaped for a small private-user alpha after the successful two-account PQ messaging test. It adds local unread counters, authenticated read-receipt routing, clearer message states (`sending`, `sent/queued`, `delivered`, `read`), mobile chat back navigation, contact removal, local blocking and unblock controls.

Blocking is deliberately client-controlled in this milestone: a blocked FREE ID is retained only in a local block list and new envelopes/contact-card pushes from that ID are ignored by the client. The relay is not given plaintext or a social-policy role. This is not yet metadata-private blocking: the relay may still observe routing metadata.

Read receipts are optional protocol metadata in the current implementation and reveal to relay infrastructure that one authenticated identity acknowledged message IDs from another. They do not expose message plaintext. A later privacy mode should allow users to disable read receipts and reduce metadata correlation.

FREE-023 does not change FREE Chain Genesis, Founder allocation, monetary policy, cryptographic identity format, Recovery Kit format, or `FOUNDER_GENESIS_SECRET`.


### FREE-023 recovery
New accounts use a compact Recovery Address plus Recovery Secret and PIN. The relay stores ciphertext only. Existing FREE-RK1 Recovery Kits can still be restored and migrated.


## FREE-023 — multi-device testnet
- Same Account Identity can keep multiple Device IDs connected concurrently.
- Relay persists an account-scoped device registry and exposes it only to authenticated sessions over WebSocket.
- Settings > Devices shows current/online/last-seen state and can revoke another Device ID.
- Revocation commands are ML-DSA-65 signed by the Account Identity.
- Testnet limitation: because restored browser clients still possess the Account Identity secret key, this is not yet hardware-rooted theft resistance; production design requires device-scoped credentials plus root-key isolation/rotation.


## FREE-024 — Whitepaper Web
FREE-024 adds `/whitepaper`, a dedicated reader generated from the single living `WHITEPAPER.md` source. It includes fixed contents navigation, an on-page outline, reading progress, implementation-status legend, responsive mobile navigation and a Copy Markdown action. The website does not fork or duplicate the Whitepaper content.
