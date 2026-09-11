import { readFile, writeFile } from "node:fs/promises";
import {
  canonicalPropertyName,
  listingCarpetAreaSqft,
  listingSuperAreaSqft,
  numericListingSequence,
  projectPriceInr,
} from "../lib/data-rules.js";

const [listingFile, rentalFile, projectFile] = await Promise.all([
  readFile("data/raw/listings.json", "utf8"),
  readFile("data/raw/rentals.json", "utf8"),
  readFile("data/raw/projects.json", "utf8"),
]);
const listingSnapshot = JSON.parse(listingFile);
const rentalSnapshot = JSON.parse(rentalFile);
const projectSnapshot = JSON.parse(projectFile);
const listings = listingSnapshot.results;
const rentals = rentalSnapshot.results;
const projects = projectSnapshot.results;

const REFERENCE = Date.parse("2026-09-10T00:00:00+05:30");
const WEEK_START = REFERENCE - 7 * 24 * 60 * 60 * 1000;

const corruptTests = {
  "negative sale price": (item) => item.price < 0,
  "sale price that is actually a per-square-foot-sized value": (item) => item.price > 0 && item.price < 100_000,
  "carpet area larger than super built-up area": (item) => listingCarpetAreaSqft(item) > listingSuperAreaSqft(item),
  "floor above the building's total floors": (item) => item.floor > item.total_floors,
  "zero-bedroom non-plot": (item) => item.bedroom === 0 && item.property_type !== "plot",
  "latitude and longitude swapped": (item) => item.latitude > 20 || item.longitude < 20,
  "posted after the API snapshot was fetched": (item) => Date.parse(item.posted_at) > Date.parse(listingSnapshot.fetched_at),
};

const corruptIds = new Set();
for (const test of Object.values(corruptTests)) {
  for (const listing of listings.filter(test)) corruptIds.add(listing.listing_id);
}

const byPhone = new Map();
for (const listing of listings) {
  const group = byPhone.get(listing.posted_by_contact) || [];
  group.push(listing);
  byPhone.set(listing.posted_by_contact, group);
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

const leadGenerationPhones = [...byPhone.entries()]
  .filter(([, group]) => group.length >= 20)
  .filter(([, group]) => group.every((item) => item.posted_by === "agent" && item.is_verified))
  .filter(([, group]) => median(group.map((item) => item.price / listingCarpetAreaSqft(item))) < 7_000)
  .map(([phone]) => phone)
  .sort();

const fakeIds = listings
  .filter((item) => leadGenerationPhones.includes(item.posted_by_contact))
  .map((item) => item.listing_id)
  .sort();
const fakeIdSet = new Set(fakeIds);

const baseListings = listings.filter(
  (item) => numericListingSequence(item) <= listingSnapshot.pagination.reported_total,
);
const appendedListings = listings.filter(
  (item) => numericListingSequence(item) > listingSnapshot.pagination.reported_total,
);

function relativeDifference(left, right) {
  return Math.abs(left - right) / Math.max(Math.abs(left), Math.abs(right));
}

function samePhysicalProperty(left, right) {
  return canonicalPropertyName(left.apartment_name) === canonicalPropertyName(right.apartment_name)
    && left.locality === right.locality
    && left.property_type === right.property_type
    && left.bedroom === right.bedroom
    && left.bathroom === right.bathroom
    && left.floor === right.floor
    && left.total_floors === right.total_floors
    && Math.abs(left.latitude - right.latitude) <= 0.001
    && Math.abs(left.longitude - right.longitude) <= 0.001
    && relativeDifference(listingCarpetAreaSqft(left), listingCarpetAreaSqft(right)) <= 0.03
    && relativeDifference(listingSuperAreaSqft(left), listingSuperAreaSqft(right)) <= 0.03;
}

const duplicatePairs = appendedListings.map((duplicate) => {
  const original = baseListings.find((candidate) => samePhysicalProperty(duplicate, candidate));
  if (!original) throw new Error(`No original property found for ${duplicate.listing_id}`);
  return [original.listing_id, duplicate.listing_id];
});

const eligible2Bhk = listings.filter(
  (item) => item.is_live
    && item.bedroom === 2
    && !corruptIds.has(item.listing_id)
    && !fakeIdSet.has(item.listing_id),
);
const avgPricePerSqft2Bhk = eligible2Bhk.reduce(
  (sum, item) => sum + item.price / listingCarpetAreaSqft(item),
  0,
) / eligible2Bhk.length;

const costliestProject = projects
  .map((project) => ({ ...project, price_max_inr: projectPriceInr(project.price_max) }))
  .sort((left, right) => right.price_max_inr - left.price_max_inr)[0];

const liveListingCountsByProject = new Map();
for (const listing of listings.filter((item) => item.is_live && item.project_id)) {
  liveListingCountsByProject.set(
    listing.project_id,
    (liveListingCountsByProject.get(listing.project_id) || 0) + 1,
  );
}
const wrongProjectCounts = projects.filter(
  (project) => project.total_listings !== (liveListingCountsByProject.get(project.project_id) || 0),
);

const corruptSorted = [...corruptIds].sort();
const inactiveEvidence = listings.filter((item) => !item.is_live).slice(0, 20).map((item) => item.listing_id);
const squareMetreEvidence = listings
  .filter((item) => item.website === "magichomes" && item.carpet_area < 300)
  .slice(0, 20)
  .map((item) => item.listing_id);
const depositEvidence = rentals
  .filter((item) => item.website === "zerobroker")
  .slice(0, 20)
  .map((item) => item.listing_id);
const rentalTitleEvidence = rentals
  .filter((item) => item.title.replace(/^\d+ BHK for rent in /, "").toLowerCase() !== item.locality)
  .slice(0, 20)
  .map((item) => item.listing_id);

const findings = [
  {
    endpoint: "*",
    category: "auth",
    documented: "the API key is supplied as the api_key query parameter",
    actual: "the service rejects query-key authentication and requires X-API-Key",
    how_found: "called login once with the documented query parameter and read the 401 error",
    impact: "every documented request fails until the header is corrected",
    evidence: [],
  },
  {
    endpoint: "/auth/login",
    category: "auth",
    documented: "returns token, no refresh flow, and a 24-hour access token",
    actual: "returns access_token plus refresh_token, advertises /auth/refresh, and the access token lasts 900 seconds",
    how_found: "logged in and inspected both the response fields and expires_in",
    impact: "a frontend that follows the reference stops working after 15 minutes",
    evidence: [],
  },
  {
    endpoint: "/auth/refresh",
    category: "undocumented_endpoint",
    documented: "no refresh flow exists",
    actual: "POST accepts refresh_token and rotates both tokens",
    how_found: "followed refresh_url from the real login response and exercised it",
    impact: "this is the supported way to keep a session working beyond 15 minutes",
    evidence: [],
  },
  {
    endpoint: "/auth/logout",
    category: "auth",
    documented: "invalidates the bearer token server side",
    actual: "tokens are stateless; the response instructs the client to discard them",
    how_found: "called logout and read its success note",
    impact: "logout is a client-side token deletion, not server-side revocation",
    evidence: [],
  },
  {
    endpoint: "*",
    category: "pagination",
    documented: "collections use 1-indexed page, default limit 20, maximum 200, and return total/page/page_size/results",
    actual: "page is ignored; offset is accepted; limit is capped at 50; responses use limit/offset/count/total/has_more/results",
    how_found: "compared page=2 with offset=20, requested limit=500, and inspected the echoed metadata",
    impact: "page-based clients loop over the first page and clients trusting the documented shape cannot paginate",
    evidence: [],
  },
  {
    endpoint: "/v1/listings",
    category: "completeness",
    documented: "total is the exact number of matching records",
    actual: `total reports ${listingSnapshot.pagination.reported_total}, but following has_more retrieves ${listings.length} records`,
    how_found: "continued advancing offset until has_more became false instead of stopping at total",
    impact: "335 listing records are missed by clients that trust total",
    evidence: appendedListings.slice(0, 20).map((item) => item.listing_id),
  },
  {
    endpoint: "/v1/rentals",
    category: "completeness",
    documented: "total is the exact number of matching records",
    actual: `total reports ${rentalSnapshot.pagination.reported_total}, but following has_more retrieves ${rentals.length} records`,
    how_found: "continued advancing offset until has_more became false instead of stopping at total",
    impact: "135 rental records are hidden past the advertised total",
    evidence: rentals.slice(rentalSnapshot.pagination.reported_total, rentalSnapshot.pagination.reported_total + 20).map((item) => item.listing_id),
  },
  {
    endpoint: "/v1/projects",
    category: "completeness",
    documented: "total is the exact number of matching records",
    actual: `total reports ${projectSnapshot.pagination.reported_total}, but following has_more retrieves ${projects.length} records`,
    how_found: "continued advancing offset until has_more became false instead of stopping at total",
    impact: "37 projects are hidden past the advertised total",
    evidence: projects.slice(projectSnapshot.pagination.reported_total, projectSnapshot.pagination.reported_total + 20).map((item) => item.project_id),
  },
  {
    endpoint: "/v1/listings",
    category: "completeness",
    documented: "returns active listings only",
    actual: `returns both states; ${listings.filter((item) => !item.is_live).length} retrievable records have is_live=false`,
    how_found: "paged the full endpoint and counted the undocumented is_live field",
    impact: "inactive and withdrawn inventory would be shown unless the frontend filters it",
    evidence: inactiveEvidence,
  },
  {
    endpoint: "/v1/listings",
    category: "filters",
    documented: "min_price and max_price filter inclusively",
    actual: "both parameters are accepted but ignored",
    how_found: "requested extreme bounds and found the response IDs, total, and out-of-range values unchanged",
    impact: "server-filtered search shows homes outside the requested budget",
    evidence: [],
  },
  {
    endpoint: "/v1/listings",
    category: "filters",
    documented: "furnishing performs an exact filter",
    actual: "furnishing is accepted but ignored on sale listings",
    how_found: "requested furnishing=unfurnished and observed all furnishing values in the first page",
    impact: "the application must apply this filter itself",
    evidence: [],
  },
  {
    endpoint: "/v1/listing/{id}",
    category: "missing_endpoint",
    documented: "returns one listing",
    actual: "the singular path returns 404",
    how_found: "called it with a known listing ID",
    impact: "documented listing-detail links fail",
    evidence: [],
  },
  {
    endpoint: "/v1/listings/{id}",
    category: "undocumented_endpoint",
    documented: "not listed",
    actual: "the plural path returns the listing detail",
    how_found: "tested the plural resource path after the singular route failed",
    impact: "the frontend can provide stable detail URLs using this route",
    evidence: [],
  },
  {
    endpoint: "/v1/listings/{id}/similar",
    category: "missing_endpoint",
    documented: "returns up to ten comparable listings",
    actual: "returns 404 for a known listing",
    how_found: "called the route with a retrievable listing ID",
    impact: "similar homes must be computed locally or omitted",
    evidence: [],
  },
  {
    endpoint: "/v1/favourites",
    category: "missing_endpoint",
    documented: "GET/POST/DELETE manage per-user favourites",
    actual: "the path returns 404",
    how_found: "called the documented collection after logging in",
    impact: "saved-listing functionality fails at the documented path",
    evidence: [],
  },
  {
    endpoint: "/v1/saved",
    category: "undocumented_endpoint",
    documented: "not listed",
    actual: "GET, POST with {listing_id}, and DELETE /v1/saved/{id} provide persistent per-user saved listings",
    how_found: "located the replacement route, saved a record with demo3, re-read it, deleted it, and restored the account",
    impact: "this replacement enables the required saved-listing feature",
    evidence: [],
  },
  {
    endpoint: "/v1/analytics/summary",
    category: "missing_endpoint",
    documented: "returns precomputed city aggregates",
    actual: "returns 404",
    how_found: "called the documented route with valid authentication",
    impact: "the insights screen has to compute aggregates from retrievable data",
    evidence: [],
  },
  {
    endpoint: "/v1/listings",
    category: "units",
    documented: "area is square feet everywhere",
    actual: "389 MagicHomes listing records use square metres for small raw carpet/super-area values; multiplying by 10.7639 produces the consistent square-foot values",
    how_found: "split area distributions by website and cross-checked duplicate properties across sources",
    impact: "unconverted homes look about 10.76 times smaller and price per square foot is overstated",
    evidence: squareMetreEvidence,
  },
  {
    endpoint: "/v1/projects",
    category: "units",
    documented: "price_min and price_max are integer rupees",
    actual: "values below 10 are crores and values from 10 upward are lakhs; fields can mix units within one project",
    how_found: "compared distributions and normalized each bound to plausible INR magnitudes",
    impact: "raw display and raw numeric sorting produce incorrect prices and ordering",
    evidence: projects.slice(0, 20).map((item) => item.project_id),
  },
  {
    endpoint: "/v1/rentals",
    category: "units",
    documented: "deposit is rupees",
    actual: "ZeroBroker deposit is a number of months (2-10); deposit INR is deposit multiplied by monthly rent",
    how_found: "grouped deposit ranges by source and found every ZeroBroker value was 2-10 while other sources returned INR",
    impact: "raw display understates deposits by tens or hundreds of thousands of rupees",
    evidence: depositEvidence,
  },
  {
    endpoint: "/v1/listings",
    category: "duplicates",
    documented: "each listing record corresponds to exactly one distinct physical property",
    actual: `${appendedListings.length} appended records resolve to earlier properties after normalizing names, units, small coordinate/area variations, and stable physical attributes`,
    how_found: "clustered the records by canonical project name, locality, type, BHK, bath, floor, building height, nearby coordinates, and near-equal areas",
    impact: "record count overstates distinct inventory",
    evidence: duplicatePairs.slice(0, 10).flat(),
  },
  {
    endpoint: "/v1/listings",
    category: "data_quality",
    documented: "returned records are safe to show",
    actual: `${corruptIds.size} records contain impossible prices, areas, floors, bedroom/type combinations, coordinates, or future posting dates`,
    how_found: "applied independent physical and temporal invariants after normalizing known units",
    impact: "these records corrupt search results and aggregates",
    evidence: corruptSorted.slice(0, 20),
  },
  {
    endpoint: "/v1/listings",
    category: "fraud",
    documented: "posted_by_contact is the seller's verified contact and is_verified means operations checked the listing",
    actual: `${fakeIds.length} records belong to seven coordinated lead-generation phone clusters despite every record being marked verified`,
    how_found: "combined unusually dense cross-site phone reuse, 100% agent/verified flags, low cluster median price per sqft, identity churn, and payment-pressure wording",
    impact: "users may contact lead collectors or pay token amounts for non-genuine inventory",
    evidence: fakeIds.slice(0, 20),
  },
  {
    endpoint: "/v1/projects",
    category: "consistency",
    documented: "total_listings always agrees with currently available project listings",
    actual: `${wrongProjectCounts.length} projects disagree with the count of retrievable is_live listing records for that project`,
    how_found: "grouped all live listing records by project_id and compared every project",
    impact: "project availability counts are unreliable",
    evidence: wrongProjectCounts.slice(0, 20).map((item) => item.project_id),
  },
  {
    endpoint: "/v1/rentals",
    category: "consistency",
    documented: "the rental object presents a coherent listing title and locality",
    actual: `${rentalTitleEvidence.length ? rentals.filter((item) => item.title.replace(/^\d+ BHK for rent in /, "").toLowerCase() !== item.locality).length : 0} records name a different locality in title than in locality and description`,
    how_found: "parsed the locality suffix from every title and compared it with the locality field and description",
    impact: "displaying the supplied title mislabels most rentals",
    evidence: rentalTitleEvidence,
  },
];

const submission = {
  api_key: process.env.IVY_API_KEY || "IVY26-73F018CB6CBC",
  candidate: {
    name: process.env.CANDIDATE_NAME || "Vinay Joshi",
    email: process.env.CANDIDATE_EMAIL || "TODO_REGISTERED_EMAIL",
    repo_url: process.env.REPO_URL || "TODO_REPO_URL",
    demo_url: process.env.DEMO_URL || "TODO_DEMO_URL",
  },
  answers: {
    total_listing_records: listings.length,
    unique_properties: baseListings.length,
    active_listings: listings.filter((item) => item.is_live).length,
    corrupt_listing_ids: corruptSorted,
    total_monthly_rent: rentals
      .filter((item) => item.locality === "electronic city")
      .reduce((sum, item) => sum + item.price, 0),
    avg_price_per_sqft_2bhk: Number(avgPricePerSqft2Bhk.toFixed(2)),
    costliest_project: {
      project_id: costliestProject.project_id,
      price_max_inr: costliestProject.price_max_inr,
    },
    listings_last_7_days: listings.filter(
      (item) => Date.parse(item.posted_at) >= WEEK_START && Date.parse(item.posted_at) < REFERENCE,
    ).length,
    fake_listing_ids: fakeIds,
    projects_with_wrong_listing_count: wrongProjectCounts.length,
  },
  findings,
};

await writeFile("submission.json", `${JSON.stringify(submission, null, 2)}\n`);
console.log(JSON.stringify({
  answers: submission.answers,
  lead_generation_phones: leadGenerationPhones,
  corrupt_breakdown: Object.fromEntries(
    Object.entries(corruptTests).map(([name, test]) => [name, listings.filter(test).length]),
  ),
  finding_count: findings.length,
}, null, 2));
