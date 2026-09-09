# FREE-006 — Post-Quantum Federated Node Foundation

FREE is an experimental pseudonymous E2EE communication protocol. **FREE app ≠ FREE network.** FREE-006 continues directly from the FREE-004/005 post-quantum foundation and begins removing the single-relay assumption.

## What changed in FREE-006

FREE-006 introduces a standalone `FREE node` mode. The same `server.js` can be run by FREE Inc., a community member, a company, or directly on a user's own computer. Nodes can connect to multiple bootstrap peers and then gossip additional public node URLs. A browser client talks to any FREE node it trusts as a transport endpoint; encrypted/signed user messages can be routed across connected FREE nodes.

Render is therefore no longer a protocol requirement. It can remain one convenient bootstrap/test node while the network grows. If one node disappears, users attached to other connected nodes can continue routing through the remaining federation.

### Federation transport

Each FREE node:

- has a locally generated persistent random Node ID;
- accepts browser clients on `/ws`;
- accepts node-to-node federation on `/federation`;
- advertises locally connected pseudonymous FREE IDs to peers;
- routes signed encrypted envelopes to a peer that currently advertises the recipient;
- falls back to bounded federation flooding when no direct route is known;
- can fetch a public PQ Identity Card from connected peers;
- gossips known node URLs so bootstrap peers are not the only peers forever.

Nodes are deliberately treated as **untrusted transport**. User messages remain FREE-PQ1 encrypted and ML-DSA signed end-to-end. A federation node does not receive private identity keys or plaintext message content.

## Important privacy limit

FREE-006 improves decentralization/availability, but **federation is not yet metadata anonymity**. Nodes may still observe pseudonymous routing IDs, connection timing, IP addresses and traffic sizes. Presence gossip is a practical discovery mechanism for this prototype and is explicitly not the final private-discovery design.

Future privacy layers should replace this with privacy-preserving mailbox/discovery, rotating routing identifiers, packet padding, multi-hop routing/mix strategies and stronger traffic-analysis defenses.

## FREE-PQ1 stays unchanged

- ML-DSA-65 identity/signatures (NIST FIPS 204)
- ML-KEM-768 key encapsulation (NIST FIPS 203)
- AES-256-GCM content encryption
- HKDF-SHA-512 message-key derivation
- SHA-512-derived 256-bit Full FREE ID
- no ECDH/ECDSA/RSA on the active public-key security path

FREE-006 does not reintroduce hybrid classical cryptography.

## Account identity model

FREE uses **one cryptographic Account Identity per FREE account**. A phone, PC or tablet is not a separate FREE identity. Future multi-device support will authorize devices under the same Account Identity; device/session keys are authorization tools, not replacement identities.

## Running your own FREE node

Requirements: Node.js 22 LTS recommended.

### Windows easiest path

1. Extract the ZIP.
2. Double-click `start-free-node.bat`.
3. On first run it performs `npm install` and builds the browser PQ bundle.
4. Open `http://localhost:3000` in Chrome.

That node works without Render for the local computer. Other machines on the same LAN can use `http://YOUR-PC-LAN-IP:3000` while your firewall permits the port.

### Join other FREE nodes

Set environment variables before `npm start`:

```text
PUBLIC_NODE_URL=https://the-public-url-of-this-node.example
BOOTSTRAP_PEERS=https://node-a.example,https://node-b.example
```

`PUBLIC_NODE_URL` is optional for a private/local-only node. `BOOTSTRAP_PEERS` can contain several nodes. No single bootstrap URL is authoritative.

For a home node to accept connections from the public Internet without a hosting provider, the operator generally needs a public/reachable IP, router port forwarding and TLS/reverse-proxy setup. A local node behind NAT can still be useful locally and can make outbound federation connections, but inbound public reachability requires network configuration outside FREE itself.

## Updating the existing FREE003 Render deployment

The repository can jump directly from the currently deployed FREE003 code to FREE-006. FREE-004 and FREE-005 do not need to be deployed first. Push the contents of this ZIP over the repository root and let Render redeploy. `/health` should then report `"version":"FREE-006"` plus `nodeId`, `federationPeers` and `knownPeers`.

Keep the existing Render service as the first bootstrap/test node while validating FREE-006. Once multiple independent public nodes exist, Render can be removed without changing the protocol.

## What FREE-006 is NOT

- It is not a blockchain and does not store messages/photos on-chain.
- It is not yet a DHT.
- It is not yet a Tor/mixnet-style anonymity network.
- It does not yet guarantee private social-graph discovery.
- It is not production-secure or independently audited.

The point of FREE-006 is to move from **one hosted relay** toward **many replaceable FREE nodes** while preserving the FREE-PQ1 end-to-end security model.
