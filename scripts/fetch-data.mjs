import { mkdir, writeFile } from "node:fs/promises";

const baseUrl = process.env.IVY_BASE_URL || "https://solve.ivy.homes";
const apiKey = process.env.IVY_API_KEY;
const email = process.env.IVY_EMAIL || "demo1@ivy.homes";
const password = process.env.IVY_PASSWORD;

if (!apiKey || !password) {
  throw new Error("Set IVY_API_KEY and IVY_PASSWORD before running this script.");
}

async function request(path, { method = "GET", body, token } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "X-API-Key": apiKey,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`${method} ${path} -> ${response.status}: ${JSON.stringify(payload)}`);
  }
  return payload;
}

const login = await request("/auth/login", {
  method: "POST",
  body: { email, password },
});

async function fetchCollection(path) {
  const results = [];
  let offset = 0;
  let pageMeta;

  do {
    const separator = path.includes("?") ? "&" : "?";
    pageMeta = await request(`${path}${separator}limit=50&offset=${offset}`, {
      token: login.access_token,
    });
    results.push(...pageMeta.results);
    offset += pageMeta.count;
    console.log(`${path}: ${results.length}/${pageMeta.total}`);
  } while (pageMeta.has_more && pageMeta.count > 0);

  return {
    fetched_at: new Date().toISOString(),
    endpoint: path,
    pagination: {
      requested_limit: 50,
      effective_limit: pageMeta.limit,
      reported_total: pageMeta.total,
      retrievable_total: results.length,
    },
    results,
  };
}

await mkdir("data/raw", { recursive: true });
for (const [name, path] of [
  ["listings", "/v1/listings"],
  ["rentals", "/v1/rentals"],
  ["projects", "/v1/projects"],
]) {
  const data = await fetchCollection(path);
  await writeFile(`data/raw/${name}.json`, `${JSON.stringify(data, null, 2)}\n`);
}

console.log("Raw API snapshot complete.");
