# FREE-009 Architecture

## Security invariant

FREE-009 preserves the FREE-PQ1 post-quantum E2EE path. Federation nodes are untrusted routers. They must never be required to hold message plaintext, account private keys, Recovery secrets or PINs.

## Account identity

One FREE account has one self-certifying PQ Account Identity. Display name and device list are attributes of that account; a device does not become a separate user identity.

```text
               FREE ACCOUNT
                    |
             PQ Account Identity
                    |
       +------------+------------+
       |            |            |
     Phone          PC         Tablet
  authorized     authorized   authorized
```

Complete device authorization/revocation is future protocol work.

## Node authentication

Node sends a random challenge. Client signs the canonical byte string:

`FREE-AUTH-1:<full-id>:<challenge>`

with the ML-DSA-65 Account Identity secret key. The node:
1. hashes the ML-KEM-768 + ML-DSA-65 public identity card back to the claimed Full ID;
2. verifies the ML-DSA signature over the canonical challenge string;
3. only then binds that socket to the FREE Account ID.

This avoids JSON serialization/order ambiguity in the previous prototype authentication path.

## Recovery UX

Account Recovery Kit + 4–6 digit Personal PIN restore the same account identity. The exported kit is encrypted on-device. FREE does not maintain a master recovery key.

The local prototype does not yet provide rollback-resistant attempt counting. The 5–20 attempt/crypto-erasure policy requires a distributed, tamper-resistant recovery capability design before it can be claimed as enforced.

## Node federation

```text
Browser A -> Node A <==== federation ====> Node B <- Browser B
                 \\                     //
                  <==== Node C =========>
```

Browser transport: `/ws`
Node federation: `/federation`

Federation is an availability/decentralization layer, not the final metadata-private routing layer.

## Trust boundary

A malicious node can drop, delay, replay or observe routing metadata. It should not be able to forge a valid account-authentication proof or user message signature, and it should not read E2EE message content. Production work still needs replay windows, PQ ratcheting, private discovery, metadata-hiding transport, robust routing, authenticated capabilities and abuse/Sybil defenses.


## Economic authority boundary

FREE-009 introduces deterministic testnet inflation accounting. Founder/developer allocation is derived automatically from each epoch's new emission. Economic authority is architecturally separate from communication identity, node identity, user keys and encrypted data. Future authority roles are Economic, Upgrade, Emergency and Treasury, with post-quantum signatures and public policy activation.
