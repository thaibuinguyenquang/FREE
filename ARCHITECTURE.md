# FREE-011 Architecture

FREE-011 adds `chain/chain.js`, the first native FREE Chain Genesis Testnet ledger. Genesis contains chain state, economic policy, addresses and security epoch. Each subsequent epoch produces a protocol-inflation transaction, updates deterministic state, links to the previous block, commits transaction/state roots, and signs the block payload with a persisted ML-DSA-65 authority key.

Communication identity, node identity, founder economic address and chain authority are separate namespaces. Chain authority has no decryption route into account private keys, Recovery Kits, PINs, messages or vault plaintext.

The browser retains IndexedDB name `free-v01` for identity compatibility. A visible boot fallback prevents silent black-screen startup failures. Static assets use no-store during testnet iteration to reduce stale-code mismatches after Render deploys.

Current chain consensus is deliberately labeled single-authority Genesis Testnet. Multi-validator consensus, block gossip/synchronization, finality/fork-choice, wallet transaction signatures and governance authority separation are next protocol layers, not features claimed by FREE-011.

## Founder Genesis Economic Identity

FREE-011 separates the founder economic identity from user/account identity and node identity. `FOUNDER_GENESIS_SECRET` deterministically derives an ML-DSA-65 keypair; only the public key and `FREE1-GENESIS-*` address are committed to Genesis state. The founder secret/private key is not exposed by the chain API and has no capability to decrypt user data. Inflation rewards target this address by deterministic protocol rule.
