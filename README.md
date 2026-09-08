# FREE v0.2 — Internet-ready prototype

FREE is a pseudonymous messenger prototype where the user's identity and private keys are created and kept in the browser. The relay routes encrypted envelopes; it does not receive plaintext message contents.

## Included
- Persistent device-local identity in IndexedDB
- Invite link + QR
- 1:1 end-to-end encryption
- ECDH P-256 + HKDF-SHA256 + AES-256-GCM
- ECDSA P-256 message signatures
- HTTPS/WSS-compatible same-origin WebSocket relay
- Offline ciphertext queue with TTL and per-identity limit
- HTTP/WebSocket rate limiting
- Same-origin WebSocket checks
- Security headers + CSP
- Health endpoint: `/health`
- Render and Railway deployment configs

## Run locally
Requires Node.js 20+.

```bash
npm start
```

Open `http://localhost:3000` on two devices/browser profiles, exchange invite links, and chat.

## Deploy
Push the extracted project files to a GitHub repository. Then connect that repository to Render or Railway. Both platforms can use the included configuration files.

For a public URL, HTTPS is provided by the hosting platform and the browser automatically connects to the relay over WSS.

### Offline queue persistence
By default the queue is stored in `./data/offline-queue.json`. On hosts with ephemeral filesystems this can be lost on redeploy/restart. For durable offline delivery, attach a persistent disk/volume and set `DATA_DIR` to its mount path, or replace this prototype queue with a database.

## Optional environment variables
- `PORT` — supplied automatically by most hosts
- `DATA_DIR` — persistent storage directory
- `MAX_QUEUE_PER_ID` — default `500`
- `QUEUE_TTL_MS` — default 7 days
- `HTTP_RATE_PER_MIN` — default `120`
- `WS_RATE_PER_MIN` — default `180`
- `ALLOWED_ORIGINS` — comma-separated explicit origins; otherwise same host is enforced

## Security scope
FREE v0.2 is safer to expose on the Internet than v0.1, but it is still a prototype, not a production-secure messenger. Before serious use it should add an audited modern session protocol with forward secrecy/ratcheting, verified device keys/safety numbers, encrypted attachment transport, multi-device key management and revocation, stronger anti-abuse controls, metadata minimization, durable database-backed queues, monitoring, backup strategy, and professional cryptographic/security review.
