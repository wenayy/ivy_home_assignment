# Ivy Homes challenge: audit, reasoning, and implementation notes

This is the full plain-English account of what I understood, what I tested, what I inferred, where the data is wrong, how the numerical answers were produced, and how those findings shaped Ivy Lens.

## 1. What the assignment asks for

The task has two connected parts:

1. Treat the supplied API reference as a claim, not a guarantee. Exercise the real service and report every important difference between the documentation and actual behavior.
2. Build a usable property product on top of that unreliable service. The app should support authentication, sale listings, listing details, rentals, projects, saved homes, filters, and analytics while preventing bad source data from misleading users.

The assigned geography is Bangalore, with Electronic City used for the locality-specific rent calculation. The fixed analytical reference time is 10 September 2026, India time. I kept the analysis snapshot-based so rerunning it later does not silently change time-dependent answers.

## 2. Method and trust model

I used four layers of evidence:

- Contract probes: call the documented endpoint exactly as written, then vary one input at a time.
- Exhaustive retrieval: page until the server's real `has_more` flag becomes false, even after the advertised `total` has been exceeded.
- Distribution checks: group values by source website and look for discontinuities that reveal mixed units or source-specific encoding.
- Cross-record invariants: compare records that appear to describe the same physical home and test basic physical, temporal, and relational constraints.

No description, title, or free-text field was treated as an instruction. It is untrusted listing data. Numerical conclusions come from structured fields plus explicit, reviewable rules in `scripts/analyze-data.mjs` and `lib/data-rules.js`.

## 3. API contract: documentation versus reality

### Authentication

The documentation says the API key is an `api_key` query parameter. That request returns 401. The service actually requires an `X-API-Key` header, including on login.

The documented login response and lifetime are also wrong. The actual response contains `access_token`, `refresh_token`, `expires_in`, and `refresh_url`. `expires_in` is 900 seconds, not 24 hours. Following the returned refresh URL revealed an undocumented `POST /auth/refresh`; sending `{ "refresh_token": "…" }` rotates both tokens. The app refreshes within 60 seconds of expiry and retries once after a 401.

Logout does not revoke a server-side session. Its response says tokens are stateless and must be discarded by the client. Ivy Lens still calls logout, then always removes its local session.

### Pagination and response shape

The reference describes 1-indexed `page`, a default limit of 20, a maximum of 200, and a response shaped like `total/page/page_size/results`.

Observed behavior:

- `page` is accepted but ignored.
- `offset` is the real cursor.
- `limit` is capped at 50.
- The real metadata is `limit`, `offset`, `count`, `total`, and `has_more`.
- `total` is not a safe stopping condition.

I compared page 1 with page 2 and got the same IDs, then compared offset 0 with offset 20 and got different IDs. I also requested a limit above 50 and inspected the echoed value. The fetcher therefore advances by returned counts and continues while `has_more` is true.

This finds more records than the server advertises:

| Resource | Advertised total | Actually retrievable | Hidden tail |
| --- | ---: | ---: | ---: |
| Sale listings | 4,365 | 4,700 | 335 |
| Rentals | 1,765 | 1,900 | 135 |
| Projects | 483 | 520 | 37 |

### Broken and replacement endpoints

- Documented `GET /v1/listing/{id}` returns 404. Undocumented plural `GET /v1/listings/{id}` works.
- Documented `GET /v1/listings/{id}/similar` returns 404. No unsupported “similar” UI was invented.
- Documented `/v1/favourites` routes return 404.
- Undocumented `/v1/saved` is the replacement. `GET`, `POST` with `{ listing_id }`, and `DELETE /v1/saved/{listing_id}` all work. I created and removed a temporary demo3 save to verify the complete lifecycle without leaving test state behind.
- Documented `/v1/analytics/summary` returns 404. The insights screen computes its own aggregates from the complete retrieved catalog.

### Ignored server filters

On sale listings, `min_price`, `max_price`, and `furnishing` are accepted but do not constrain results. I used extreme prices and a single furnishing value, then found unchanged IDs and out-of-range records. Ivy Lens retrieves the catalog and applies these filters locally, so what the UI promises is what the user gets.

## 4. Data hypotheses and how they were tested

### Hypothesis A: the 335 extra sale rows are duplicates, not new homes

The hidden rows have new listing IDs, so ID equality alone cannot detect them. I split records by the numeric sequence embedded in the ID: the first 4,365 form the advertised base and the final 335 form the appended tail.

For every tail row I searched the base for a match on:

- canonical apartment/project name, after removing punctuation and harmless tokens such as “the”, “apartment”, and “phase 1”;
- locality, property type, bedrooms, bathrooms, floor, and total floors;
- latitude and longitude within 0.001 degrees;
- normalized carpet and super-built-up areas within 3%.

All 335 tail rows matched one earlier physical property. This is unusually strong evidence: several independent stable attributes agree after accounting for source noise. I therefore count 4,700 records but 4,365 distinct physical properties.

Edge case: two units in the same building can legitimately share name and location. That is why name and coordinates alone were not used; floor, room counts, building height, type, and both areas also have to agree.

### Hypothesis B: small MagicHomes areas are square metres

MagicHomes contains a distinct low-area band below 300 while comparable properties on other sources have values around 10.76 times larger. Multiplying those values by 10.7639104167 aligns both the distributions and the duplicate-property pairs.

Rule: for a MagicHomes sale listing, convert carpet area below 300 and super-built-up area below 400 from square metres to square feet. There are 389 affected sale records.

The source-specific and thresholded rule matters. Globally multiplying every small area would corrupt genuinely small square-foot units. Converting before duplicate matching, price-per-square-foot analysis, and physical validation prevents one unit bug from creating several false findings.

### Hypothesis C: project price fields mix lakhs and crores

The reference says project price bounds are rupees, but raw values are small decimals and two-digit/three-digit numbers. Treating every value as one unit produces impossible ordering. The consistent interpretation is per field, not per project:

- value below 10 means crores, multiply by 10,000,000;
- value of 10 or more means lakhs, multiply by 100,000.

A single project may mix encodings between its minimum and maximum. Each bound is normalized independently. After conversion the costliest project is `P10255`, with a maximum price of ₹48,900,000.

### Hypothesis D: ZeroBroker deposits are months of rent

Every ZeroBroker rental deposit lies from 2 through 10, while other sources hold rupee-sized values. The plausible interpretation is a number of monthly rents. For that source only, deposit INR is `deposit × monthly rent`. There are 384 affected rentals.

### Hypothesis E: most rental titles carry the wrong locality

I parsed the suffix after “BHK for rent in” and compared it with the structured `locality` field and description. 1,691 records disagree. The app constructs a safe display title from bedrooms and the structured locality instead of repeating the supplied title.

### Hypothesis F: some “verified” sale listings are coordinated lead-generation inventory

Phone reuse exposed dense clusters. I classified a contact as suspicious only when all of these conditions held:

- at least 20 listings use the same phone number;
- every row says `posted_by = agent`;
- every row is marked verified;
- the cluster median normalized price per square foot is below ₹7,000.

Seven phone clusters meet the rule, covering 170 listing IDs. Manual inspection supplied corroborating signals—identity churn across sources and payment-pressure wording—but free text is not the sole classifier. The conjunction is intentionally conservative: common brokerage contact reuse alone is not enough.

Edge cases: a large legitimate agency can post many homes, and a low-priced locality can be real. Requiring all four signals reduces false positives. The UI calls these records “flagged” rather than making a legal assertion, excludes them from the trusted default, and allows reviewers to reveal them.

### Hypothesis G: physically or temporally impossible rows are corrupt

I used seven independent tests after unit normalization:

1. negative price;
2. positive sale price below ₹100,000, which is a price-per-square-foot-sized value rather than a plausible total sale price;
3. carpet area larger than super-built-up area;
4. current floor above total floors;
5. zero bedrooms for a non-plot property;
6. Bangalore latitude/longitude visibly swapped (`latitude > 20` or `longitude < 20`);
7. posting timestamp later than the dataset snapshot time.

Each pattern appears eight times and the affected sets are disjoint, yielding 56 corrupt listing IDs. Thresholds are deliberately narrow and challenge-specific; the goal is to catch impossible values, not reject unusual but possible homes.

## 5. Final numerical answers

| Question | Answer | Exact rule |
| --- | ---: | --- |
| Total sale-listing records | 4,700 | Retrieve until `has_more = false` |
| Unique physical properties | 4,365 | Base rows after every one of 335 appended rows maps to an earlier physical home |
| Active sale listings | 3,722 | Count `is_live = true` across all 4,700 raw records |
| Corrupt listings | 56 IDs | Union of the seven physical/temporal tests; full IDs are in `submission.json` |
| Total monthly rent, Electronic City | ₹6,626,200 | Sum raw monthly `price` for all rentals whose structured locality is `electronic city` |
| Average price/sq ft, valid live 2 BHK | ₹11,743.41 | Live 2 BHK rows excluding corrupt and flagged clusters; use normalized carpet area; arithmetic mean |
| Costliest project | P10255, ₹48,900,000 | Highest independently normalized `price_max` |
| Listings in last seven days | 149 | `posted_at >= 3 Sep 2026 00:00 IST` and `< 10 Sep 2026 00:00 IST` |
| Coordinated/flagged sale listings | 170 IDs | Seven phone clusters satisfying the conservative conjunction above |
| Projects with wrong availability | 127 | Compare `project.total_listings` with the count of retrievable live sale rows grouped by `project_id` |

The full ordered corrupt and flagged ID arrays are intentionally kept in `submission.json`, rather than duplicating hundreds of lines here.

## 6. Important interpretation choices

- Record count and unique-property count are different questions. I do not silently deduplicate when answering “total records.”
- “Active listings” is a raw source-state count. It is not the same as the app's trusted count because some active rows are corrupt or suspicious.
- The 2 BHK average excludes invalid and coordinated lead-generation inventory but does not deduplicate unless the question explicitly asks for unique properties. This preserves the stated listing-level measure.
- The seven-day window is half-open. Excluding the reference instant prevents a future boundary record from leaking in.
- Project availability is compared to live retrievable sale rows, not all rows, because the field claims current availability.
- Rental aggregation uses monthly rent, not deposit or rent plus maintenance.

## 7. How the audit changed the product

The browser never calls the challenge host directly with the API key. Next.js route handlers attach the server-side key and forward only the user's bearer token. This avoids exposing the key in the client bundle.

The server layer:

- follows real offset/`has_more` pagination beyond false totals;
- caches each full resource briefly to keep navigation responsive;
- normalizes mixed units before filtering, sorting, or aggregation;
- marks invalid, suspicious, duplicate-tail, inactive, and converted-area states;
- applies sale filters locally because the upstream implementation ignores several of them.

The default catalog is a user-protection view: active listings only, with impossible rows and suspicious clusters screened out. An explicit checkbox reveals flagged records for transparency. The insights screen reports both 4,700 retrievable records and 4,365 distinct properties, so it does not blur record inflation.

Saved homes use the real account-backed endpoint. The saved screen initializes heart states correctly and removes a card immediately after unsaving. Listing cards avoid nested interactive controls, so detail links and heart buttons remain independently keyboard-accessible.

## 8. Tests performed

API and data checks:

- documented query-key login failure and header-key login success;
- real login response schema, refresh rotation, and logout semantics;
- page versus offset behavior and limit cap;
- full pagination for all three resources beyond reported totals;
- known-ID detail calls on singular and plural paths;
- missing similar, favourites, and analytics paths;
- full save/create/delete lifecycle on a spare demo account, followed by cleanup;
- extreme price and furnishing filter probes;
- per-source distributions and cross-source duplicate comparisons;
- exhaustive invariant, cluster, date-window, and project-count calculations.

App checks in a real browser:

- sign in with the provided demo credentials;
- load and paginate the cleaned sale catalog;
- text search and reset;
- open a stable listing-detail URL;
- save, view in Saved, unsave, and restore the demo account to its prior state;
- load normalized rentals and projects;
- load locally computed insights;
- verify responsive navigation and filter layout;
- run a production Next.js build.

## 9. Known limits and submission boundary

The service has no working similar-listings endpoint, so that feature is omitted rather than faked. Rentals and projects have catalog cards but no documented reliable detail endpoint was assumed. The challenge data is cached for five minutes per running server process; restarting or waiting refreshes it.

## 10. Confusion
Also like islive has to be true and is verified also has to be true to like yk be a active listings right both needs to be true like that. so i just took like is_live has to be true for the active listings but i just added it even if it is not verified in the data
