const baseUrl = process.env.IVY_BASE_URL || "https://solve.ivy.homes";
const apiKey = process.env.IVY_API_KEY;
const password = process.env.IVY_PASSWORD;

if (!apiKey || !password) throw new Error("Set IVY_API_KEY and IVY_PASSWORD.");

async function call(path, { method = "GET", body, token } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "X-API-Key": apiKey,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return {
    status: response.status,
    body: await response.json().catch(() => null),
  };
}

const login = await call("/auth/login", {
  method: "POST",
  body: { email: "demo2@ivy.homes", password },
});
const token = login.body.access_token;

function collectionSummary(response, field, expected) {
  const body = response.body;
  return {
    status: response.status,
    limit: body?.limit,
    offset: body?.offset,
    count: body?.count,
    total: body?.total,
    has_more: body?.has_more,
    first_ids: body?.results?.slice(0, 5).map((item) => item.listing_id || item.project_id),
    all_first_page_match: body?.results?.every((item) => item[field] === expected),
  };
}

const probes = {};
const collectionCases = [
  ["listings_baseline", "/v1/listings?limit=5"],
  ["listings_page_2", "/v1/listings?limit=5&page=2"],
  ["listings_offset_5", "/v1/listings?limit=5&offset=5"],
  ["listings_limit_500", "/v1/listings?limit=500"],
  ["listings_locality", "/v1/listings?limit=50&locality=electronic%20city", "locality", "electronic city"],
  ["listings_bhk", "/v1/listings?limit=50&bhk=2", "bedroom", 2],
  ["listings_bedroom", "/v1/listings?limit=50&bedroom=2", "bedroom", 2],
  ["listings_property_type", "/v1/listings?limit=50&property_type=villa", "property_type", "villa"],
  ["listings_furnishing", "/v1/listings?limit=50&furnishing=unfurnished", "furnishing", "unfurnished"],
  ["rentals_locality", "/v1/rentals?limit=50&locality=electronic%20city", "locality", "electronic city"],
  ["rentals_bhk", "/v1/rentals?limit=50&bhk=2", "bedroom", 2],
  ["rentals_furnishing", "/v1/rentals?limit=50&furnishing=unfurnished", "furnishing", "unfurnished"],
  ["projects_locality", "/v1/projects?limit=50&locality=electronic%20city", "locality", "electronic city"],
  ["projects_status", "/v1/projects?limit=50&project_status=ready%20to%20move", "project_status", "ready to move"],
];

for (const [name, path, field, expected] of collectionCases) {
  probes[name] = collectionSummary(await call(path, { token }), field, expected);
}

for (const [name, path, field, direction] of [
  ["listings_min_price", "/v1/listings?limit=50&min_price=20000000", "price", "min"],
  ["listings_max_price", "/v1/listings?limit=50&max_price=8000000", "price", "max"],
  ["listings_price_asc", "/v1/listings?limit=50&sort_by=price&order=asc", "price", "asc"],
  ["listings_price_desc", "/v1/listings?limit=50&sort_by=price&order=desc", "price", "desc"],
  ["rentals_price_desc", "/v1/rentals?limit=50&sort_by=price&order=desc", "price", "desc"],
  ["projects_price_desc", "/v1/projects?limit=50&sort_by=price_max&order=desc", "price_max", "desc"],
]) {
  const response = await call(path, { token });
  const values = response.body?.results?.map((item) => item[field]) || [];
  probes[name] = {
    status: response.status,
    total: response.body?.total,
    values: values.slice(0, 12),
    satisfies: direction === "min"
      ? values.every((value) => value >= 20_000_000)
      : direction === "max"
        ? values.every((value) => value <= 8_000_000)
        : values.every((value, index) => index === 0 || (direction === "asc" ? values[index - 1] <= value : values[index - 1] >= value)),
  };
}

const routes = [
  "/v1/listing/MAG-1002627",
  "/v1/listings/MAG-1002627",
  "/v1/listings/MAG-1002627/similar",
  "/v1/rentals/R1000001",
  "/v1/projects/P10001",
  "/v1/favourites",
  "/v1/saved",
  "/v1/analytics/summary",
];
for (const path of routes) {
  const response = await call(path, { token });
  probes[`route ${path}`] = {
    status: response.status,
    shape: Array.isArray(response.body)
      ? "array"
      : response.body && typeof response.body === "object"
        ? Object.keys(response.body).slice(0, 12)
        : typeof response.body,
  };
}

probes.login = {
  status: login.status,
  keys: Object.keys(login.body),
  expires_in: login.body.expires_in,
  refresh_url: login.body.refresh_url,
};

console.log(JSON.stringify(probes, null, 2));
