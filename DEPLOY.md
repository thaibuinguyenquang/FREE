# Deploy FREE v0.2

## Render (simplest path)
1. Create a GitHub repository and upload all files from this folder.
2. In Render choose **New > Blueprint** or **New > Web Service**.
3. Connect the GitHub repository.
4. Runtime: Node.
5. Build command: `npm install`.
6. Start command: `npm start`.
7. Health check path: `/health`.
8. Deploy.
9. Open the HTTPS URL Render provides. FREE will automatically use `wss://` for the relay.

For reliable offline delivery across service restarts, add a persistent disk and set `DATA_DIR` to its mount path. Without a persistent disk the app still runs, but queued offline ciphertext can disappear after a restart/redeploy.

## Railway
1. Create a project from the GitHub repository.
2. Railway detects Node automatically; `railway.toml` provides the start and health-check settings.
3. Generate a public domain in Railway settings.
4. Open that HTTPS URL.

## First two-device test
1. Open the public FREE URL on device A and device B.
2. Each device receives its own local identity.
3. On A choose **Share identity** and copy its invite link.
4. Open/paste that link on B to add A.
5. Repeat B -> A.
6. Select the contact and send a message.
7. Test offline delivery by closing B, sending from A, then reopening B.

Important: browser storage owns the current prototype identity. Clearing site data or using another browser/device creates another identity. Multi-device identity recovery is not implemented yet.
