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
