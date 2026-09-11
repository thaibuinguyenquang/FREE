# FREE-013 Architecture

FREE-013 establishes a clean `free-testnet-2` ledger in `data/free-chain-testnet-2.json` without rewriting Testnet-1 history. Genesis contains chain state, economic policy, addresses and security epoch. Each subsequent epoch produces a protocol-inflation transaction, updates deterministic state, links to the previous block, commits transaction/state roots, and signs the block payload with a persisted ML-DSA-65 authority key.

Communication identity, node identity, founder economic address and chain authority are separate namespaces. Chain authority has no decryption route into account private keys, Recovery Kits, PINs, messages or vault plaintext.

The browser retains IndexedDB name `free-v01` for identity compatibility. A visible boot fallback prevents silent black-screen startup failures. Static assets use no-store during testnet iteration to reduce stale-code mismatches after Render deploys.

Current chain consensus is deliberately labeled single-authority Genesis Testnet. Multi-validator consensus, block gossip/synchronization, finality/fork-choice, wallet transaction signatures and governance authority separation are next protocol layers, not features claimed by FREE-013.

## Founder Genesis Economic Identity

FREE-013 separates the founder economic identity from user/account identity and node identity. `FOUNDER_GENESIS_SECRET` deterministically derives an ML-DSA-65 keypair; only the public key and `FREE1-GENESIS-*` address are committed to Genesis state. The founder secret/private key is not exposed by the chain API and has no capability to decrypt user data. Inflation rewards target this address by deterministic protocol rule.


## Testnet-2 state conservation
Genesis supply is 500,000,000 FREE. Founder receives 75,000,000 FREE; the remaining 425,000,000 FREE is represented explicitly in a locked Genesis Reserve so the sum of balances equals total supply. Validation rejects a Testnet-2 ledger that violates the 4% issuance ceiling or supply-conservation invariant. If a Testnet-1 file exists, it is read only to create a public continuity reference and is never mutated.

## FREE-023 network/authentication delta
Federation peers now use persistent ML-DSA-65 node credentials. A node ID is derived from its PQ public key, and the federation hello signature binds node ID, version, advertised public URL, public key and advertised local user routes. Node credentials are distinct from Account Identity and Founder/Economic Identity.

Public user identity cards contain public keys only and are persisted by a relay for contact resolution; no user private key is written there. Outgoing message retry stores the already encrypted/signed wire envelope in the sender's local IndexedDB alongside local chat state. Relays still see routing metadata, and federation is not anonymous.


## FREE-023 private-alpha delta
- Unread/read state is local message metadata.
- Read receipts are routed only after browser identity authentication; plaintext remains E2EE.
- Local block list prevents blocked IDs from being accepted by the client.
- Contact removal is a local action and does not mutate another user's identity.
- Mobile chat navigation has an explicit back state.


## Whitepaper delivery surface — FREE-027
`WHITEPAPER.md` remains the canonical living document. `/whitepaper` renders that file client-side through same-origin `/whitepaper.md`; no second Whitepaper source is maintained. The route is documentation-only and does not receive account secrets, Recovery credentials or message plaintext.


## FREE-027 encrypted account vault sync
`/api/account-vault?address=...` stores opaque AES-256-GCM ciphertext only. Updates are ML-DSA-65 signed and bound to the authenticated account. Client state is merged by message ID before a new encrypted revision is written. This remains testnet architecture; conflict handling is not yet a production CRDT.


## FREE-027 restored-device envelope bootstrap
A recipient must not silently drop a valid encrypted envelope solely because a restored installation has not yet synchronized its contact list. Each routed envelope may carry the sender's public FREE-PQ card. The recipient recomputes the self-certifying identity fingerprint, requires it to equal the envelope `from` ID, then verifies the ML-DSA-65 message signature before decryption. This bootstraps only public contact material; secret keys and plaintext remain endpoint-only.

The Messenger shell is also constrained to the dynamic viewport (`100dvh`) with nested `min-height:0` scroll containers, keeping the composer visible at normal browser zoom.


## FREE-030 Distributed Storage v1
Device storage is now treated as a bounded cache rather than the canonical long-term archive. The client encrypts each message again for archival storage using an account-owned AES-256-GCM archive key derived locally from PQ account secret material. The ciphertext is addressed by SHA-256 CID and uploaded over the authenticated PQ WebSocket session. The storage gateway verifies CID integrity and an ML-DSA-65 account signature before accepting the chunk. Per-account manifests map message IDs to ciphertext CIDs.

The current Render relay is one professional testnet gateway. The wire contract is intentionally node-oriented so later independent storage nodes can implement the same put/get/receipt flow. FREE Chain does not store message chunks. Future PoUS must add randomized possession/retrieval challenges, replication diversity, repair, anti-Sybil controls and chain settlement before rewards can be called production-grade.


## FREE-031 archive restore boundary
Compact Recovery restores account authority (PQ identity + recovery secret/PIN binding). Long-term chat history is a separate encrypted storage concern. After successful PQ authentication the client requests its revisioned archive manifest, retrieves owned ciphertext chunks, derives the archive key locally from account secret material, decrypts locally and merges by immutable `msgId`. The gateway learns ciphertext/CID/account ownership metadata but not message plaintext or the archive key.

Archive manifests use revision 2 semantics: content chunks deduplicate by CID; message entries deduplicate by `msgId`; attempting to bind an existing `msgId` to a different CID is rejected.

## FREE-033 — Easy Recovery UX

- Messenger users restore with a memorable `FREE Name` such as `thai.free`, a masked 10-digit Secret, and a 4–6 digit PIN.
- The 10-digit Secret and PIN do **not** replace the underlying high-entropy cryptographic Recovery Secret. The client wraps that cryptographic secret locally and the relay stores only the encrypted wrapper plus the public lookup name.
- Recovery Address / Recovery Secret / legacy kits remain available under **Advanced Recovery** for node, farm, treasury and high-value economic identities.
- Easy Recovery v1 is a testnet usability layer. It uses PBKDF2-SHA-512 and client-side encryption; a future threshold/PAKE design is required before calling low-entropy recovery production-grade. FREE has no plaintext PIN endpoint and no master reset key.
