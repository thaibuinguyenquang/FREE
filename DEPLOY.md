# FREE-009 deployment

The live FREE-006 Render service can be upgraded directly to FREE-009.

1. Replace the GitHub repository root with the FREE-009 files.
2. Commit to `main` (suggested message: `FREE007`).
3. Render will run `npm install` and `npm start` from `render.yaml`.
4. Open `/health` and confirm `"version":"FREE-009"`.
5. Open the main FREE URL without clearing browser site data.
6. The existing FREE-006 PQ identity should be preserved; FREE-009 will ask for display name, PIN and Recovery Kit setup.
7. Confirm the status changes from `đang xác thực · PQ` to `đã kết nối · PQ`.

Only after client authentication succeeds should federation Node #2 testing continue.
