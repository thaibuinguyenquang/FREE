# FREE-011 deployment

Upgrade the existing Render service directly to FREE-011. Replace the repository root with this package and commit `FREE011`. Render should run `npm install` and `npm start`.

After deployment, verify `/health` reports `FREE-011`. Then open `/api/chain`: it must report `network: FREE Chain Genesis Testnet`, `height >= 0`, a `genesisHash`, a founder economic address and `postQuantumSignedBlocks: true`. After about 60 seconds on the default testnet policy, refresh `/api/chain`; height should increase and founder balance should become greater than zero.

Do not clear browser site data while diagnosing the prior black-screen issue because the existing FREE identity is stored locally. FREE-011 now shows a persistent boot/error screen instead of silently displaying black if client initialization fails.

The testnet chain file and PQ chain-authority key are stored under `DATA_DIR`. Render instances without persistent disk may lose/reset this testnet state on redeploy. Do not treat the current testnet authority key as production custody.

## Founder Genesis secret (required)

Before the deploy, add a Render secret environment variable named `FOUNDER_GENESIS_SECRET`. Use a high-entropy value at least 32 characters long and keep a private offline backup. Never commit it to GitHub. FREE-011 refuses to start without it. The same value deterministically produces the same `FREE1-GENESIS-*` founder economic address on every redeploy. After deployment, open `/api/founder` to see the public founder address and reward balance. Do not change this secret after Genesis, or the node will reject the stored chain because the founder public key/address no longer matches.
