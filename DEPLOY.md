# FREE-013 deployment — Testnet-2 Genesis

FREE-013 deliberately starts a **new chain**: `free-testnet-2`. It does not rewrite or migrate balances/blocks from the earlier `free-testnet-1` ledger.

The new ledger is stored as `data/free-chain-testnet-2.json`. If the old `data/free-chain-testnet.json` exists, FREE-013 reads only its public chain identifiers/hashes and records a read-only migration reference in the new Genesis state. The old file is never modified by the migration code.

Keep the existing Render secret `FOUNDER_GENESIS_SECRET` unchanged. The same secret preserves the Founder Genesis Economic Identity, while the new Testnet-2 Genesis assigns exactly 75,000,000 FREE (15% of 500,000,000) to that address.

Deploy by replacing the GitHub repository root with FREE-013 and commit `FREE013`. Render should run `npm install` and `npm start`.

After deployment verify, in order:

1. `/health` reports `FREE-013`.
2. `/api/chain` reports `chainId: free-testnet-2` and `network: FREE Chain Freedom Economy Testnet-2`.
3. Genesis supply is `500000000` FREE.
4. Founder Genesis allocation is `75000000` FREE.
5. `genesisReserve` is `425000000` FREE and is marked locked/unallocated.
6. `policy.annualInflationRate` is `0.025` and `hardMaxGrossInflation` is `0.04`.
7. After roughly 60 seconds, height increases and protocol emission is distributed according to the test policy.

Do not clear browser site data while diagnosing the client because the existing FREE communication identity is local to the browser. FREE-013 remains testnet software with no monetary value and no production decentralized consensus yet.

## FREE-023 independent-node test
Keep `FOUNDER_GENESIS_SECRET` private and unchanged for the existing Testnet-2 founder identity. A node that should be discoverable by other FREE nodes needs `PUBLIC_NODE_URL` set to its public HTTPS base URL. Additional nodes can use comma-separated `BOOTSTRAP_PEERS` values pointing at known FREE node base URLs. Each FREE-023 node creates and persists a separate ML-DSA-65 federation identity in its `DATA_DIR`; durable `DATA_DIR` storage is therefore important for stable node identity.

After deployment, `/health` should report `version: "FREE-023"` and `federationAuth: "ML-DSA-65"`. `federationPeers` greater than zero only proves an authenticated peer connection; it does not prove blockchain consensus.


## FREE-023 verification
After deploy, verify `/health` reports `version: "FREE-023"`. Test with two independent browser profiles: send both directions, leave one conversation closed to verify unread count, open it to verify sender status reaches `read`, then test remove/block/unblock. Do not clear the founder browser's site data or change `FOUNDER_GENESIS_SECRET`.


## FREE-027 Whitepaper route
After deployment, verify `https://<service>/whitepaper` and `https://<service>/whitepaper.md`. The rendered page must load from the same `WHITEPAPER.md` committed with the release.


## FREE-027 data directory
Keep `DATA_DIR` persistent for recovery capsules, offline queue, device registry, FREE Chain testnet state, and `account-vaults/`. Without persistent storage, encrypted account-vault continuity can be lost on host replacement/redeploy.


## FREE-027 browser acceptance checks
After deployment, verify at 100% browser zoom that the message composer remains visible. With a recipient account online on a clean/restored browser that has no local contacts, send a new message from an existing contact. The recipient should automatically display the authenticated sender/contact after validating the self-certifying public card and should decrypt the message, while the sender should progress to a delivery acknowledgement.


## FREE-028 storage persistence
`DATA_DIR/storage-chunks` and `DATA_DIR/storage-manifests` contain encrypted archive chunks and account manifests. For continuity across redeploys, `DATA_DIR` must be backed by persistent storage. Without a persistent disk, the professional testnet gateway can lose archived ciphertext on service replacement/redeploy even though the client protocol itself remains content-addressed.
