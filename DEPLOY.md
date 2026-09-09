# FREE-006 deployment

The currently live FREE003 Render service can be upgraded directly to FREE-006; FREE-004/005 do not need separate deployments.

1. Replace the repository root with the FREE-006 files while keeping the same GitHub repository.
2. Commit to `main`.
3. Render will run `npm install` and `npm start` from `render.yaml`.
4. Visit `/health`. Confirm `version` is `FREE-006` and note `nodeId`.
5. Keep browser site data during testing so legacy local data is not accidentally cleared.

For decentralization testing, run a second node on another computer or public host and set its `BOOTSTRAP_PEERS` to the Render URL. For a second public node, also set `PUBLIC_NODE_URL` to its own public HTTPS URL. Once both nodes report federation peers, users connected to different nodes can route signed encrypted traffic across the federation.
