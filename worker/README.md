# Lore proxy (Cloudflare Worker)

Keeps the Gemini API key off the client. The app sends the signed-in player's
Firebase ID token; the worker verifies it against Google's public certificates,
rate-limits per user (60 requests/hour), and forwards the prompt to Gemini.

## Deploy

```bash
cd worker
bun install
# edit wrangler.toml: FIREBASE_PROJECT_ID and ALLOWED_ORIGINS
bunx wrangler secret put GEMINI_API_KEY
bun run deploy
```

Then set `VITE_LORE_PROXY_URL` to the worker URL (in `.env` locally and as a
GitHub Actions secret for the Pages build) and remove `VITE_GOOGLE_API_KEY`.

The free Cloudflare tier is plenty for a personal tracker.
