# FREE White Paper

**Living document — updated through FREE-013 Freedom Economy Testnet**

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
FREE-013 is experimental software. It demonstrates a PQ-native browser identity/messaging path, federation foundation, encrypted-vault experiments, node service accounting, deterministic inflation logic and a native Genesis Testnet ledger. It does not yet provide production consensus, production anonymous routing, a production PQ ratchet, mature distributed storage repair, transferable token wallets, production governance, or audited security.

## 14. Roadmap
Near-term work: stabilize FREE-013 client authentication/onboarding; run multiple FREE nodes; add peer chain synchronization and validator consensus; add transferable PQ economic wallet transactions beyond the Founder Genesis identity; bind useful-service proofs to on-chain node rewards; implement signed policy/upgrade authorities and timelocks; improve distributed storage durability; then test economic simulations before any real-value token launch. Privacy and user-key sovereignty remain mandatory throughout.

## 15. Testnet-2 Genesis transition
FREE-013 establishes `free-testnet-2` as a new experimental genesis rather than rewriting the immutable history of the earlier Testnet-1 ledger. Where Testnet-1 data is locally available, Testnet-2 records only a read-only continuity reference (chain ID and public hashes/height). No old block is mutated and no Testnet-1 balance is silently transformed into Testnet-2 state.

Testnet-2 starts with 500,000,000 FREE. Exactly 75,000,000 FREE (15%) is assigned to the Founder Genesis Economic Identity. The remaining 425,000,000 FREE is held in a protocol-labeled, locked Genesis Reserve and is explicitly **unallocated** pending economic simulation. The reserve is not Founder property. This preserves supply accounting without prematurely fixing the remaining 85% mainnet allocation.

## 16. FREE-014 — usable messenger and independent-node foundation
FREE-014 shifts the near-term emphasis from token design to user utility and network independence while preserving the Testnet-2 monetary constitution from FREE-013.

The browser messenger keeps Account Identity and message content client-side. A sender encapsulates a fresh ML-KEM-768 shared secret per message, derives an AES-256-GCM key, encrypts the plaintext locally, and signs the encrypted envelope with ML-DSA-65. Relay and federation nodes route ciphertext. FREE-014 also persists public PQ identity cards at the node so a contact can still be resolved after that user disconnects from the relay, and it retains encrypted outgoing wire envelopes locally so messages created while disconnected can be retried after authenticated reconnection. These are usability/durability improvements, not a claim of a production double-ratchet or metadata anonymity.

Independent FREE nodes now authenticate federation hello messages with a persistent ML-DSA-65 node key. The node identifier is derived from the PQ public key, and the signed hello binds node ID, software version, advertised URL, public key and advertised user routes. This prevents an unauthenticated peer from simply choosing another node's identifier in the federation handshake. It does not yet constitute validator consensus, Sybil resistance, anonymous routing or Byzantine finality.

The freedom test remains architectural: no single FREE Inc. relay should be required for the mature network to operate. FREE-014 is a foundation toward that target, not completion of it. Multiple independently operated nodes still need deployment tests, chain synchronization, validator rules, fork choice/finality, service-proof economics and adversarial testing before mainnet claims are justified.
