# FREE-006 Architecture

## Security invariant

FREE-006 preserves the FREE-PQ1 post-quantum E2EE path. Federation nodes are untrusted routers. They must never be required to hold message plaintext, account private keys, Recovery secrets or PINs.

## Account identity

One FREE account has one self-certifying PQ Account Identity. Multiple devices will later be authorized under that same identity; devices do not become separate user identities.

## Node federation

```text
Browser A -> Node A <==== federation ====> Node B <- Browser B
                 \\                     //
                  <==== Node C =========>
```

Browser transport: `/ws`
Node federation: `/federation`

A node can start with zero or many bootstrap URLs. Nodes exchange public node URLs and local pseudonymous presence advertisements. Routing first uses learned recipient routes, then a bounded TTL flood when no route is known.

This is deliberately an availability/decentralization foundation, not the final metadata-private routing layer.

## Trust boundary

A malicious node can drop, delay, replay or observe routing metadata. It should not be able to forge a valid FREE user message because envelopes are end-to-end ML-DSA signed; it should not read content because content is encrypted from the ML-KEM-derived message secret.

Production work still needs replay windows, ratcheting, private discovery, metadata-hiding transport, authenticated node policy/capabilities, robust routing and abuse/Sybil defenses.
