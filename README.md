# Ivy Lens

Ivy Lens is a production-style Bangalore property browser built for the Ivy Homes internship challenge. It uses the live challenge API, repairs the API/data inconsistencies found during the audit, and exposes searchable sale listings, rentals, projects, saved homes, listing details, and market insights.

## Run locally

1. Copy `.env.example` to `.env.local` and set the challenge API key.
2. Install packages with `npm install`.
3. Start the app with `npm run dev`.
4. Open `http://localhost:3000` and sign in with one of the provided demo accounts.

The app requires Node.js 20.9 or newer. The API key stays on the server: browser requests go through the app's route handlers.

## Verification

```text
npm run build
node scripts/analyze-data.mjs
```

`scripts/fetch-data.mjs` refreshes the ignored `data/raw/` snapshots. `scripts/probe-api.mjs` reproduces the API-contract checks. `scripts/analyze-data.mjs` rebuilds `submission.json` from the snapshots.

## Important files

- `submission.json` — machine-readable answers and all 25 API/data findings.
- `AUDIT_AND_REASONING.md` — plain-English reasoning, hypotheses, tests, results, edge cases, and product decisions.
- `lib/data-rules.js` — shared unit and identity normalization rules.
- `lib/server-data.js` — complete pagination, normalization, screening, and cache logic used by the app.
- `app/api/catalog/route.js` — reliable local filtering, sorting, and pagination.

## Product behavior

- The default sale view includes only active, physically plausible listings and removes the coordinated lead-generation clusters.
- “Include flagged records” deliberately reveals the suspect inventory for auditability; inactive homes remain excluded from the main catalog.
- MagicHomes areas, ZeroBroker rental deposits, and project prices are normalized before display or aggregation.
- Saved homes use the real replacement `/v1/saved` endpoint and persist per demo account.
- Access tokens are refreshed through the discovered `/auth/refresh` flow before their 15-minute expiry.

Candidate email, public repository URL, and deployed demo URL remain explicit placeholders in `submission.json` until those user-owned values exist.

