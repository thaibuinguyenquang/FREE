# FREE-033 — Easy Recovery Messenger

FREE is an experimental post-quantum-native private communication protocol and decentralized network. **FREE app ≠ FREE network.** FREE-033 keeps the FREE-PQ1 messenger, encrypted archive and FREE Chain testnet while simplifying ordinary-user recovery to FREE Name + 10-digit Secret + PIN. Advanced cryptographic recovery remains available for node/farm/treasury identities.

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


## FREE-027 — Whitepaper Web
FREE-027 adds `/whitepaper`, a dedicated reader generated from the single living `WHITEPAPER.md` source. It includes fixed contents navigation, an on-page outline, reading progress, implementation-status legend, responsive mobile navigation and a Copy Markdown action. The website does not fork or duplicate the Whitepaper content.


## FREE-027 — Encrypted Account Vault Sync
FREE-027 adds an opaque encrypted account-vault sync surface for contacts, conversation state and encrypted message-history snapshots. The relay stores ciphertext only. Vault encryption is derived from the local Recovery Secret plus the account PQ private signing material, so a server-side recovery-address leak alone is not sufficient to decrypt the vault. Sync merges by message ID before upload. Existing data that was already lost before FREE-027 cannot be reconstructed unless another device still retains it.


## FREE-027 — Messenger transport and viewport hardening
FREE-027 fixes two private-alpha blockers found during live browser testing. The Messenger now occupies the available viewport instead of extending the composer below the browser window, so sending messages does not require browser zoom. New envelopes carry only the sender's public self-certifying FREE-PQ identity card; a restored device with an empty local contact list can validate that card from the full FREE ID, verify the ML-DSA-65 envelope signature, add the sender locally, decrypt the message, and return delivery acknowledgement. The relay also enriches envelopes with the already-authenticated public card when available, including queued delivery. No private key, Recovery Secret, PIN or plaintext message is added to the relay envelope.


## FREE-027 — continuity guard and desktop restore polish
FREE-027 hardens account-vault continuity after live multi-browser testing. A device must hydrate the latest encrypted remote vault before it may publish a new snapshot. If a remote vault exists but cannot be decrypted, the client refuses to overwrite it. Local encrypted-account state also keeps an account-scoped safety snapshot in IndexedDB to recover from accidental local UI/state regression. Cross-device merge remains message-ID based and ciphertext-only on the relay. Historical messages that had already disappeared before a surviving FREE-026/027 device or server vault retained them cannot be reconstructed.

Desktop Compact Recovery now accepts Enter from Recovery Address, Recovery Secret, or PIN; clicking the Restore button is no longer required. Onboarding, restore completion and in-app view changes use short native transitions while respecting reduced-motion preferences.


## FREE-030 — Distributed Storage v1
FREE-030 begins moving long-term message history out of the device-as-archive model. Each message is re-encrypted on-device under an account-owned archive key derived from the PQ account secret material, stored as a content-addressed ciphertext chunk, and indexed by an account manifest. The current relay can act as a professional testnet storage gateway; it never receives archive plaintext or the archive key. After a positive storage receipt, the browser may bound each conversation cache to the most recent 250 messages. On a restored device, FREE requests the archive manifest and hydrates the most recent 500 archived messages, merging by message ID.

This is a **testnet storage implementation**, not production Proof of Useful Service. The content-addressed receipt proves that the gateway accepted a specific ciphertext chunk. Independent challenge sampling, replication/erasure repair, anti-Sybil accounting, validator settlement and slashing are still roadmap work. Messages, media and archive ciphertext are not placed on FREE Chain.

## FREE-030 — Archive write reliability
FREE-030 moves encrypted archive writes to a signed same-origin HTTP endpoint so archival no longer depends on WebSocket request/response timing. Every stored chunk is still encrypted on-device, content-addressed by SHA-256 CID, and authorized by an ML-DSA-65 Account Identity signature. The client retries unsaved messages on later state changes and immediately schedules an archive sweep after PQ authentication. `/health` exposes `encryptedArchive.chunks` and `bytes` as an observable testnet signal.


## FREE-030 archive key correction
FREE-030 fixes the encrypted archive ingress root cause found in FREE-029: SHA-512 produces 64 bytes, while AES-256-GCM requires a 32-byte raw key. The archive KDF now domain-separates the account signing secret, hashes with SHA-512, and uses the first 32 bytes as the AES-256 key. This allows archive encryption to complete and the authenticated HTTP archive upload to execute.


## FREE-031 — Network archive restore & manifest dedup
FREE-031 separates account recovery from long-term history recovery. New compact Recovery capsules carry cryptographic account identity/profile authority, while contacts and message history are hydrated after PQ authentication from the ciphertext-only FREE archive/account vault. Existing FREE-ACCOUNT-2 capsules remain readable for migration, but a clean compact restore starts without trusting stale chat history embedded in the capsule. Archive manifests are now revisioned, message IDs are immutable within a manifest, CID storage remains content-addressed, and duplicate re-uploads do not create duplicate history.

The current professional gateway remains a testnet storage service, not decentralized durable storage. Persistent disk, independent replicas, possession/retrieval challenges, anti-Sybil scoring and chain settlement remain required before production PoUS claims.

## FREE-033 — Easy Recovery UX

- Messenger users restore with a memorable `FREE Name` such as `thai.free`, a masked 10-digit Secret, and a 4–6 digit PIN.
- The 10-digit Secret and PIN do **not** replace the underlying high-entropy cryptographic Recovery Secret. The client wraps that cryptographic secret locally and the relay stores only the encrypted wrapper plus the public lookup name.
- Recovery Address / Recovery Secret / legacy kits remain available under **Advanced Recovery** for node, farm, treasury and high-value economic identities.
- Easy Recovery v1 is a testnet usability layer. It uses PBKDF2-SHA-512 and client-side encryption; a future threshold/PAKE design is required before calling low-entropy recovery production-grade. FREE has no plaintext PIN endpoint and no master reset key.


## FREE-033 — Startup regression fix
FREE-033 fixes the FREE-032 browser boot regression where `refreshChain()` and `bootError()` were accidentally omitted while their call sites remained. This caused `ReferenceError: refreshChain is not defined` and then masked the startup diagnostic with `bootError is not defined`. The functions are restored with null-safe DOM updates. Easy Recovery, encrypted archive, account identity, FREE Chain state, Founder Genesis, and existing browser data formats are unchanged. A missing account-vault response remains non-fatal and is treated as an empty remote vault rather than a boot failure.
