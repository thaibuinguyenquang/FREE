# FREE White Paper

**Living document — updated through FREE-011 Genesis Testnet**

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
Rewards should correspond to useful network service rather than wasteful computation. The target service score includes encrypted storage, availability, retrieval success, bandwidth and reliability, with challenge-response proofs and anti-Sybil defenses. FREE-011 still has only the foundation/test accounting for this model.

## 7. FREE Chain
FREE-011 creates the first FREE Chain Genesis Testnet. Its purpose is economic coordination and protocol state, not chat storage. The chain records blocks, state roots, transaction roots, native FREE balances, economic policy, security epochs and protocol-generated reward transactions. Genesis is followed by ML-DSA-65-signed blocks.

The testnet currently uses a single authoritative block producer and therefore is not yet decentralized consensus. Future milestones require validator identities, node-to-node block propagation, deterministic validation, fork choice/finality and Byzantine/Sybil defenses.

## 8. FREE Token and inflation
FREE is intended to become the native economic asset of FREE Chain. FREE-011 units are testnet-only and have no monetary value. The protocol's economic model creates new emission periodically according to an explicit inflation policy. New emission is allocated among node operators, founder/development, ecosystem and treasury pools.

FREE-011 binds Founder/Developer rewards to a dedicated **Founder Genesis Economic Identity**. A founder-held high-entropy secret deterministically derives an ML-DSA-65 economic keypair. The public address is formatted `FREE1-GENESIS-<public-key fingerprint>`. The secret/private key never enters chain state, user data, or public APIs. Founder reward is defined as:

`FounderReward(epoch) = NewEmission(epoch) × FounderShare`

and:

`NewEmission(epoch) = Supply × AnnualInflationRate × EpochDuration / Year`

This reward does not debit user balances and is not an arbitrary admin mint. Parameters are expected to evolve through signed, public, versioned policy with timelocks and emergency procedures.

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
FREE-011 is experimental software. It demonstrates a PQ-native browser identity/messaging path, federation foundation, encrypted-vault experiments, node service accounting, deterministic inflation logic and a native Genesis Testnet ledger. It does not yet provide production consensus, production anonymous routing, a production PQ ratchet, mature distributed storage repair, transferable token wallets, production governance, or audited security.

## 14. Roadmap
Near-term work: stabilize FREE-011 client authentication/onboarding; run multiple FREE nodes; add peer chain synchronization and validator consensus; add transferable PQ economic wallet transactions beyond the Founder Genesis identity; bind useful-service proofs to on-chain node rewards; implement signed policy/upgrade authorities and timelocks; improve distributed storage durability; then test economic simulations before any real-value token launch. Privacy and user-key sovereignty remain mandatory throughout.
