# FREE-009 — Secure Identity & Recovery UX

FREE is an experimental pseudonymous, post-quantum-native E2EE communication protocol. **FREE app ≠ FREE network.** FREE-009 continues directly from FREE-006 and keeps the federated node foundation while fixing the PQ client authentication flow and adding a user-facing account/recovery experience.

## What changed in FREE-009

- Fixes the browser ↔ FREE node PQ challenge-response flow by signing a canonical `FREE-AUTH-1:<id>:<challenge>` payload with ML-DSA-65. The node recomputes the self-certifying account ID from the published ML-KEM/ML-DSA public keys and verifies the signature before accepting the socket.
- One FREE account keeps one PQ Account Identity. Devices are not separate user identities.
- First-run onboarding now offers **Create FREE ID** or **Restore FREE ID**.
- Adds a user-set display name. Display name can change without changing the cryptographic FREE ID.
- Adds a personal 4–6 digit PIN for account recovery.
- Adds an Account Recovery Kit. Restoring on another device requires both the Recovery Kit and the PIN.
- Adds Recovery Kit refresh, export/copy, and PIN change. Changing the PIN produces a new Recovery Kit while preserving the same FREE Account Identity.
- Adds Vietnamese and English UI; Vietnamese is selected automatically for Vietnamese browser locales and can be switched manually.
- Keeps Short FREE ID for human sharing, Full cryptographic ID for verification, QR/link invites, PQ E2EE messaging, encrypted distributed-vault experiment, and FREE-006 node federation.

## Security model

Active public-key security path remains `FREE-PQ1`:

- ML-KEM-768 — key establishment
- ML-DSA-65 — identity signatures and node authentication
- HKDF-SHA-512 — message-key derivation
- AES-256-GCM — symmetric authenticated encryption

FREE-009 does not reintroduce RSA, ECDH, ECDSA, or a classical fallback into the active identity/message path.

Private account keys remain in the user's encrypted/local recovery material and browser storage. FREE nodes receive public identity cards and ciphertext, never the account private key or PIN.

## Account Recovery Kit

The Account Recovery Kit is an encrypted snapshot of the FREE account state. The kit contains high-entropy recovery material and ciphertext; the user PIN is combined with that recovery material through a KDF before the snapshot can be decrypted.

The intended user model is simple:

```text
Recovery Kit + Personal PIN -> restore the same FREE Account Identity
```

Important prototype limitation: the agreed 5–20 failed-attempt policy is **not yet rollback-resistant at network level**. A purely local counter can be reset by a hostile client, so FREE-009 does not claim that this requirement is cryptographically enforced yet. Do not market the prototype as having irreversible attempt-count enforcement.

The Recovery Kit should be regenerated after important account-data changes if the user wants the exported snapshot to include the latest contacts/chat state. The distributed-vault system remains a separate experimental storage path.

## Identity model

```text
FREE Account
    |
    +-- one PQ Account Identity
    +-- one Short FREE ID
    +-- one Full cryptographic ID
    +-- display name (changeable)
    +-- authorized devices (future complete protocol)
```

A phone, PC, or tablet is not a new user identity. Future device authorization will authorize devices under the same Account Identity.

## Federation

FREE-009 retains the FREE-006 `/federation` node layer. Render may remain the first bootstrap/test node, but the network design does not require Render to be the permanent owner of the protocol. Federation improves availability and decentralization; it does **not yet provide metadata anonymity**.

## Deploy from the currently live FREE-006

Replace the repository root with the contents of this ZIP and commit to `main`. Render will run `npm install`, build `public/pq.bundle.js`, and start the service. `/health` should report `"version":"FREE-009"`.

Do not clear browser site data before testing. The browser that already created the FREE-006 PQ identity will keep that same identity and FREE-009 will ask only for the missing display name/PIN/Recovery setup.

## Prototype status

FREE-009 is not production-secure. Required future work includes an audited forward-secret/post-compromise-secure PQ messaging session protocol, rollback-resistant recovery-attempt enforcement and crypto-erasure, complete multi-device authorization/revocation, metadata-private discovery/routing, attachment encryption/lifecycle, abuse controls, durable decentralized storage, and independent cryptographic/security review.


## FREE-009 ecosystem foundation
- Voluntary node contribution with a separate local Node Identity and configurable storage capacity.
- FREE Test Credits (no monetary value, non-transferable) based on encrypted-storage receipts for testnet measurement.
- Account Identity != Node Identity != future Payment Identity.
- `/api/network` exposes aggregate testnet service metrics only.
- This is NOT a real token launch and the receipt model is NOT Sybil-resistant yet.
- Real-token prerequisites: verifiable useful-service challenges, replication/repair, anti-Sybil, privacy-preserving accounting, security audits and legal review.


## FREE-009 deterministic economic authority foundation

FREE-009 adds a **testnet accounting model** for periodic token inflation and automatic founder/developer allocation. It does not create a transferable or monetary token. The default simulation uses a 5% annual inflation rate, daily epochs, and allocates each epoch's **new emission** as 10% founder/developer, 65% node pool, 15% ecosystem and 10% treasury. These are development defaults, not final tokenomics.

Founder reward is calculated only from newly emitted units and never debits or rewrites user balances. Economic accounting is persisted separately in `data/economy-state.json`; it has no access path to user private keys, PINs, Recovery Kits, plaintext messages or vault decryption. `/api/network` exposes the active public policy and aggregate accounting for inspection.

The production design requires signed/versioned Economic Policy Manifests, separate post-quantum Economic/Upgrade/Emergency/Treasury authorities, activation timelocks, bounded emergency controls, validator/consensus rules, service-proof anti-Sybil logic, audits and legal review before any real transferable token.
