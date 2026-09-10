# FREE White Paper

**Living document — updated through FREE-026 Private Alpha**

## Abstract
FREE is a post-quantum-native private communication protocol, decentralized node network, distributed encrypted-storage system and native economic network. The FREE application is the first client, not the owner of the network. Users own their cryptographic identities, keys and data. Network operators may contribute useful resources and receive protocol rewards. Economic and upgrade authority can evolve the network without granting any authority over user plaintext or private keys.

## 1. Principles
1. FREE app ≠ FREE network.
2. One FREE account has one persistent Account Identity; devices are authorized devices, not separate user identities.
3. User identity, private keys and plaintext are user-controlled.
4. No master decryption key exists for the founder, company, nodes or chain.
5. Messages, media and files are not stored on blockchain.
6. Security is post-quantum native from genesis and crypto-agile for future threats.
7. Data has a lifecycle; encryption, expiry and crypto-erasure are preferred over permanent plaintext retention.
8. Economic authority over the ecosystem never becomes cryptographic authority over users.

## 2. Identity and recovery
A FREE account uses a self-certifying cryptographic identity with a human-facing Short ID. Display names are mutable and non-authoritative. The target recovery model requires both a high-entropy Recovery secret/Kit and a user PIN. Multi-device authorization belongs beneath the account identity. Recovery-attempt limits, anti-rollback enforcement and catastrophic security migration remain protocol work in progress.

## 3. Post-quantum cryptography
FREE-PQ1 uses ML-KEM-768 for key encapsulation and ML-DSA-65 for signatures, with AES-256-GCM and HKDF-SHA-512 for symmetric protection and derivation. FREE is designed around security epochs and crypto-suite identifiers so algorithms can be deprecated and replaced if future cryptanalysis, quantum systems or threats beyond current assumptions invalidate a suite. The target is continuity of account identity across key/security epochs rather than forcing users to rebuild their social identity after every cryptographic migration.

## 4. Messaging and data lifecycle
Content is encrypted end-to-end before untrusted relay/storage infrastructure receives it. The long-term design includes encrypted attachments, per-object keys, revocable capabilities, View Once, expiry and ciphertext garbage collection. FREE does not claim it can erase screenshots or independent copies outside the protocol.

## 5. FREE Network
Nodes can provide relay, routing, encrypted mailbox and distributed storage services. Ordinary users are not required to volunteer storage. Users may opt in to resource contribution, while professional/community/self-hosted nodes can provide durable capacity. Identity, node and economic/payment identities are separated to reduce correlation and prevent economic control from becoming account control.

## 6. Proof of Useful Service
Rewards should correspond to useful network service rather than wasteful computation. The target service score includes encrypted storage, availability, retrieval success, bandwidth and reliability, with challenge-response proofs and anti-Sybil defenses. FREE-013 still has only foundation/test accounting; production challenge proofs, anti-Sybil scoring, graceful exit and repair are roadmap work.

## 7. FREE Chain
FREE-010/011 created the first FREE Chain Genesis Testnet; FREE-013 evolves its economic constitution. Its purpose is economic coordination and protocol state, not chat storage. The chain records blocks, state roots, transaction roots, native FREE balances, economic policy, security epochs and protocol-generated reward transactions. Genesis is followed by ML-DSA-65-signed blocks.

The testnet currently uses a single authoritative block producer and therefore is not yet decentralized consensus. Future milestones require validator identities, node-to-node block propagation, deterministic validation, fork choice/finality and Byzantine/Sybil defenses.

## 8. FREE Token and monetary policy
FREE is intended to become the native economic asset of FREE Chain. FREE-013 units remain testnet-only and have no monetary value. The current design has **no maximum supply**, but gross issuance is constitutionally capped at **4% annualized**. The default testnet target is **2.5%**, deliberately below the ceiling.

The mainnet design target begins from **500,000,000 FREE Genesis supply**. The Founder Genesis Economic Identity receives **15% at Genesis = 75,000,000 FREE**. Future issuance is a separate mechanism and is currently modeled as 10% Founder/Development, 65% Nodes, 15% Ecosystem and 10% Treasury. These non-Founder allocation percentages remain testnet assumptions subject to simulation before mainnet.

`NewEmission(epoch) = Supply × min(TargetIssuance, 4%) × EpochDuration / Year`

`FounderReward(epoch) = NewEmission(epoch) × FounderShare`

The target fee economy burns a transparent portion of network fees so net supply growth can be below gross issuance and can become negative when burn exceeds issuance. FREE-013 records burn accounting fields, but **actual fee charging and burn transactions are not yet implemented**. Burn must arise from real network activity rather than artificial destruction solely to influence price.

Founder reward never debits user balances. Ordinary economic authority must not exceed the 4% gross-issuance ceiling, arbitrarily rewrite balances, seize user funds or mint outside protocol rules.

## 9. Founder and protocol authority
FREE is founder-led during early development. The intended authority model separates Upgrade, Economic, Emergency and Treasury roles. The founder can direct economics, protocol evolution, chain upgrades and emergency security migrations, including replacing cryptographic suites when necessary. Those powers must not expose APIs or keys capable of decrypting user data, seizing account identity, reading Recovery secrets or rewriting user plaintext.

The long-term authority design should use separate post-quantum keys, hardware/offline custody and threshold authorization for high-impact actions. Public policy manifests and activation delays should make economic and protocol changes observable before activation except narrowly scoped emergencies.

## 10. Storage economics
Encrypted storage and bandwidth have real costs. FREE aims to align them through useful-service rewards, optional paid capacity, premium infrastructure and self-hosting. Finite retention and crypto-erasure reduce permanent storage growth. A sustainable network must measure resource cost before final token emission and reward parameters are fixed.

## 11. Business model
FREE Inc. or other service providers may sell premium storage, bandwidth, managed nodes, enterprise infrastructure, support and related services. The protocol must remain usable by compatible clients and independent nodes. Revenue should come from service quality rather than ownership of user plaintext or identity.

## 12. Governance and security evolution
Protocol upgrades are versioned. Normal upgrades should be signed and timelocked; emergency authority may pause vulnerable economic/protocol modules and activate security migrations. User-security invariants—no master decryption key, client-controlled private keys, no plaintext on chain—are constitutional design boundaries rather than ordinary economic parameters.

## 13. Current status
FREE-026 is experimental software. It demonstrates a PQ-native browser identity/messaging path, federation foundation, encrypted-vault experiments, node service accounting, deterministic inflation logic and a native Genesis Testnet ledger. It does not yet provide production consensus, production anonymous routing, a production PQ ratchet, mature distributed storage repair, transferable token wallets, production governance, or audited security.

## 14. Roadmap
Near-term work: stabilize FREE-013 client authentication/onboarding; run multiple FREE nodes; add peer chain synchronization and validator consensus; add transferable PQ economic wallet transactions beyond the Founder Genesis identity; bind useful-service proofs to on-chain node rewards; implement signed policy/upgrade authorities and timelocks; improve distributed storage durability; then test economic simulations before any real-value token launch. Privacy and user-key sovereignty remain mandatory throughout.

## 15. Testnet-2 Genesis transition
FREE-013 establishes `free-testnet-2` as a new experimental genesis rather than rewriting the immutable history of the earlier Testnet-1 ledger. Where Testnet-1 data is locally available, Testnet-2 records only a read-only continuity reference (chain ID and public hashes/height). No old block is mutated and no Testnet-1 balance is silently transformed into Testnet-2 state.

Testnet-2 starts with 500,000,000 FREE. Exactly 75,000,000 FREE (15%) is assigned to the Founder Genesis Economic Identity. The remaining 425,000,000 FREE is held in a protocol-labeled, locked Genesis Reserve and is explicitly **unallocated** pending economic simulation. The reserve is not Founder property. This preserves supply accounting without prematurely fixing the remaining 85% mainnet allocation.

## 16. FREE-023 — usable messenger and independent-node foundation
FREE-023 shifts the near-term emphasis from token design to user utility and network independence while preserving the Testnet-2 monetary constitution from FREE-013.

The browser messenger keeps Account Identity and message content client-side. A sender encapsulates a fresh ML-KEM-768 shared secret per message, derives an AES-256-GCM key, encrypts the plaintext locally, and signs the encrypted envelope with ML-DSA-65. Relay and federation nodes route ciphertext. FREE-023 also persists public PQ identity cards at the node so a contact can still be resolved after that user disconnects from the relay, and it retains encrypted outgoing wire envelopes locally so messages created while disconnected can be retried after authenticated reconnection. These are usability/durability improvements, not a claim of a production double-ratchet or metadata anonymity.

Independent FREE nodes now authenticate federation hello messages with a persistent ML-DSA-65 node key. The node identifier is derived from the PQ public key, and the signed hello binds node ID, software version, advertised URL, public key and advertised user routes. This prevents an unauthenticated peer from simply choosing another node's identifier in the federation handshake. It does not yet constitute validator consensus, Sybil resistance, anonymous routing or Byzantine finality.

The freedom test remains architectural: no single FREE Inc. relay should be required for the mature network to operate. FREE-023 is a foundation toward that target, not completion of it. Multiple independently operated nodes still need deployment tests, chain synchronization, validator rules, fork choice/finality, service-proof economics and adversarial testing before mainnet claims are justified.

## Product usability principle — FREE-023
FREE treats cryptography and decentralization as infrastructure, not onboarding burden. A normal user should be able to create or restore an identity, add a person and exchange encrypted messages without understanding validators, storage proofs, chain state, KEMs or signatures. Advanced network participation remains opt-in and visibly testnet/experimental. This usability separation does not weaken the security boundary: a client that has not completed PQ relay authentication must not present itself as securely connected.


### FREE-023 — client reliability milestone (implemented on testnet)
FREE-023 replaces the experimental hand-written browser WebSocket frame transport with a maintained WebSocket implementation while preserving the post-quantum authentication challenge. Recovery Kit restore is completed locally and transitions directly into the Messenger state after cryptographic integrity checks. A relay connection is not considered authenticated until the ML-DSA-65 challenge signature verifies. These changes improve reliability; they do not change the project claim that production-grade recovery attempt anti-rollback, metadata privacy, multi-validator consensus, and independent security review remain future work.


### Implementation status — FREE-023
The messenger client now enforces an explicit single-screen state transition after account recovery and displays the recovered profile identity in the application shell. Browser-to-relay WebSocket admission uses same-origin or explicit allow-list validation before the ML-DSA-65 challenge-response authentication. This is an implementation hardening milestone, not a claim of production security or decentralization.


## 17. FREE-023 — private-alpha messaging semantics

After a successful two-browser exchange between independent FREE identities, FREE-023 introduces the minimum conversation semantics expected in a private alpha without changing the cryptographic trust boundary. Incoming messages can increment a local unread count. Opening a conversation marks locally stored incoming messages as read and sends an authenticated read-receipt message containing message IDs to the peer. Sender UI can therefore distinguish delivery from read state.

Read receipts are metadata, not content encryption. Relay or federation infrastructure may observe source/destination identities, timing and message/read-routing events in this testnet architecture. FREE must not market the current system as metadata anonymous. A future privacy-control milestone should make read receipts user-configurable and continue work on private discovery, padding, routing indirection and metadata minimization.

Contact removal deletes the local contact and local conversation history on that client. Blocking is also local-first: the client records the blocked FREE ID and ignores new envelopes or unsolicited contact-card pushes from it. Blocking does not grant FREE Inc. a global account-ban capability and does not destroy the other person's identity.

Mobile navigation now treats a conversation as a distinct interaction state with an explicit back-to-chats control. These changes are product-layer improvements. They do not alter FREE-PQ1, Account Identity, Founder Economic Identity, FREE Chain Testnet-2 Genesis, or the economic constitution.

## FREE-023 — Private Alpha Hardening
FREE-023 treats language, message-state privacy, local app access, and device separation as product-level security surfaces. VI/EN applies to both static and dynamically rendered messenger controls. Message delivery state is represented by compact status symbols rather than verbose protocol text. Read receipts are user-controllable because they disclose interaction metadata. App Lock can require the account PIN when reopening the local client; verification remains local and does not give the relay the PIN. Each installation also receives a separate Device ID under the same Account Identity. This is a foundation only: network-authorized multi-device enrollment and remote revocation are not yet claimed as implemented.

Implementation status: private-alpha/testnet. App Lock is a local convenience/security layer and is not yet backed by rollback-resistant network attempt accounting. Metadata anonymity, production PQ ratcheting, multi-validator consensus, and production Sybil resistance remain future work.


## FREE-023 — Compact Recovery Capsule
FREE-023 replaces the long recovery string for new accounts with three separated recovery factors: a public Recovery Address, a high-entropy Recovery Secret, and the user's PIN. The FREE relay stores only an AES-256-GCM encrypted recovery capsule addressed by the Recovery Address. The Recovery Secret is never uploaded as plaintext and the PIN is not sent to the relay. Restore requires Address + Secret + PIN. Legacy FREE-RK1 kits remain accepted as a migration path and are converted to the capsule model after successful local decryption.

Implemented/testnet limitation: the current capsule directory is a single-relay persistence mechanism, not yet decentralized or rollback-resistant. A production design must replicate encrypted capsules across independent storage nodes, authenticate capsule updates, enforce anti-rollback/versioning, and add rate-limited/abuse-resistant retrieval without weakening zero-knowledge custody.


## FREE-023 — Recovery UX and language hardening

FREE-023 keeps the FREE-023 compact-recovery cryptography unchanged while separating the user-facing concepts of Profile, Recovery, Encrypted Backup, and PIN. The UI no longer asks ordinary users to understand the internal protocol term “capsule”. Recovery Secret is masked by default and may be explicitly revealed or copied. VI/EN localization is applied to the Network and Settings surfaces, including dynamic controls.

**Implemented:** Recovery Address + Recovery Secret + PIN restore path; encrypted recovery backup; legacy-kit migration; recovery card export; separated recovery/PIN UI.

**Testnet limitation:** the encrypted account backup is still relay-hosted rather than a production distributed, rollback-resistant recovery service. Multi-device authorization and network-enforced recovery attempt limits remain roadmap items.


## FREE-023 — Secure Recovery migration UX
FREE-023 removes browser prompt-based PIN entry from Recovery. PIN entry uses an in-app password field. Existing Compact Recovery is verified cryptographically before backup refresh. Legacy FREE-RK1 accounts are verified against the legacy encrypted kit when available. For pre-Compact local accounts without a retained legacy kit, a one-time local migration creates new Compact Recovery credentials from the already-authorized local identity; this is a migration compatibility path, not a network-grade re-authentication mechanism.


## FREE-023 implementation note — device authorization
FREE-023 separates the persistent Account Identity from installation-specific Device IDs at the relay session layer. Multiple authorized installations can be online simultaneously under one FREE ID. Device revocation is an account-signed network action and does not change the user's FREE ID. This is a testnet implementation, not the final trust model: a client that retains the Account Identity signing secret can theoretically create new device authorization material if fully compromised. The production target is device-scoped post-quantum credentials, protected root authority, key rotation and auditable revocation without giving FREE Inc. access to user secrets.


## 18. FREE-026 — Whitepaper as a protocol surface

**IMPLEMENTED / TESTNET DOCUMENTATION SURFACE.** FREE-026 publishes the living Whitepaper at `/whitepaper` while keeping `WHITEPAPER.md` as the single source of truth. The reader adds structured contents navigation, section anchors, an “On this page” rail, reading progress, responsive mobile presentation, implementation-status labels and a raw-Markdown copy action. The website is intentionally separate from the Messenger interaction surface so technical depth does not burden ordinary chat users.

The documentation follows the same trust discipline as the protocol: claims must distinguish **IMPLEMENTED**, **TESTNET**, **SPECIFICATION**, and **ROADMAP** states. A web presentation must never upgrade a roadmap statement into an implementation claim merely for marketing.

FREE-026 also carries forward FREE-023 multi-device testnet authorization unchanged. Compact Recovery, Account Identity, Founder Genesis Economic Identity, Testnet-2 economics and the 4% gross-issuance ceiling are not modified by the Whitepaper website.


## 19. FREE-026 — Encrypted Account Vault Sync

**IMPLEMENTED / TESTNET.** FREE-026 introduces an encrypted account-state vault for cross-device continuity. Contacts, conversation metadata, blocked-account state and locally decrypted message history are serialized and encrypted on-device before upload. The relay persists only ciphertext, IV, revision metadata, account identifier and a post-quantum signature binding each update.

The vault key is derived locally from two pieces that are recovered only after successful account recovery: the Recovery Secret and the account's PQ private signing material. The server never receives this key. Devices fetch the latest ciphertext, decrypt locally, merge messages by message ID, then publish a newly encrypted revision. This is a testnet merge model, not yet a CRDT or formally audited multi-device state protocol.

**Limitation:** data that disappeared before FREE-026 and no longer exists on any device or queued relay ciphertext cannot be recreated cryptographically. FREE-026 prevents the same class of loss going forward; it does not invent historical plaintext that no surviving endpoint retains.


## 20. FREE-026 — Restored-device message continuity

**IMPLEMENTED / TESTNET.** A clean or restored device can receive a valid FREE-PQ envelope even before local contact metadata has synchronized. The sender's public self-certifying identity card may accompany the ciphertext. The receiving client recomputes its fingerprint, requires that fingerprint to match the envelope sender ID, and then verifies the ML-DSA-65 envelope signature before decrypting. This removes a failure mode where a valid ciphertext was silently discarded merely because the recipient's browser had an empty local contact list.

The carried identity material is public. Private signing/decapsulation keys, Recovery Secret, PIN and plaintext message content remain endpoint-only. The relay may attach a previously authenticated public card to routed/queued envelopes but cannot forge a different card for the same self-certifying FREE ID without breaking the fingerprint binding.

FREE-026 also hardens the Messenger viewport so the conversation composer remains inside the dynamic viewport at normal browser zoom. This is a usability change, not a cryptographic claim.
