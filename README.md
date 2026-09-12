# Ivy Lens

Ivy Lens is a production-style Bangalore property browser built for the Ivy Homes internship challenge. It uses the live challenge API, repairs the API/data inconsistencies found during the audit, and exposes searchable sale listings, rentals, projects, saved homes, listing details, and market insights.

The interface is built with Tailwind CSS 4 utilities, with a small global stylesheet reserved for the theme tokens, decorative background patterns, and loading animation.

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

## How I decided what to distrust

I treated the reference as a list of testable claims. I first exercised every documented route and inspected authentication, response shapes, errors, pagination metadata, filters, and sorting. I then downloaded every retrievable record and tested source-by-source distributions, physical invariants, cross-source identity matches, phone reuse, timestamps, and agreement between project and listing data.

The first matching rule was never accepted just because it explained most rows. For example, project prices cannot be normalized with one unit per project: a minimum and maximum can use different units. Duplicate detection also cannot rely on a shared phone number or apartment name; it needs stable physical attributes, nearby coordinates, and normalized areas. The detailed hypotheses, counterexamples, thresholds, and exact calculations are in `AUDIT_AND_REASONING.md`.

The product responds to each reproduced problem rather than merely documenting it: the API key is server-side, access tokens refresh, pagination follows `has_more`, ignored filters run locally, replacement detail/save paths are used, units are normalized before calculations, and suspicious or impossible inventory is screened from the default view.

## What I checked that was fine

Negative results were kept because they constrained the eventual explanation:

- The documented `locality`, `bhk`, and `property_type` filters do work for sale listings. The undocumented `bedroom` alias does not, but the documented `bhk` parameter is fine.
- Rental `locality`, `bhk`, and `furnishing` filters work.
- Project `locality` and `project_status` filters work.
- Sale price sorting works in both directions, despite price-range filtering being ignored.
- Rental price sorting and project maximum-price sorting work on the raw values returned by their endpoints.
- `GET /v1/rentals/{id}` and `GET /v1/projects/{id}` exist at the documented paths.
- The service's `limit`, `offset`, `count`, and `has_more` fields accurately describe each returned page. The false part is the documentation's page-based contract and the reliability of `total` as a stopping condition.
- The error bodies tested were useful JSON objects with a `detail` field, as promised.
- Structured locality values were internally consistent enough to use for the Electronic City rent calculation; the widespread rental problem is in the supplied title text.

These checks are reproducible with `scripts/probe-api.mjs`; its result is deliberately not padded into `findings`, because Part 3 asks only for discrepancies and penalizes guesses.

## Use of AI tools

I used an OpenAI Codex coding agent to accelerate endpoint probing, data exploration, implementation, browser testing, and documentation. I reviewed the generated code and claims, reran the analysis from the downloaded snapshots, reproduced the contract probes against the live API, and kept the final rules explicit in the repository. The agent was a tool for executing and checking hypotheses; the submitted reasoning and responsibility for it remain mine.
