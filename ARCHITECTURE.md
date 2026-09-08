# FREE v0.1 architecture

## Principles
1. FREE app is a client, not the network.
2. Identity is generated and held by the user device.
3. No phone number, email address, Apple/Google/Facebook identity is required.
4. Relay infrastructure routes ciphertext; it does not possess message decryption keys.
5. Message payloads are not stored on a blockchain.
6. Identity is pseudonymous but persistent, allowing block/reputation/rules later.

## Components
- Client: identity, key storage, contact book, encryption/decryption, chat UI.
- FREE invite: portable public identity bundle encoded in a URL/QR.
- Relay: WebSocket routing based on pseudonymous fingerprint.
- Offline queue: ciphertext envelopes persisted until recipient reconnects.

## Crypto in v0.1
- Long-term ECDH P-256 key pair for shared-secret derivation.
- Long-term ECDSA P-256 key pair for sender authentication.
- HKDF-SHA256 derives a conversation AES key from ECDH secret.
- AES-256-GCM encrypts each message with a fresh 96-bit IV.
- ECDSA signs routing-bound envelope data.

## Next protocol steps
- X3DH/Double Ratchet or equivalent for forward secrecy and post-compromise security.
- Multi-device identity and device revocation.
- Signed prekeys for asynchronous first contact.
- Contact verification via safety numbers / QR verification.
- Encrypted attachment transport with chunking.
- Group messaging protocol.
- Relay federation/discovery and client interoperability specification.
