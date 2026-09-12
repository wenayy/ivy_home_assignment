import { NextResponse } from "next/server";
import {
  getCollection,
  normalizeListings,
  normalizeProjects,
  normalizeRentals,
} from "../../../lib/server-data";

function compare(sort) {
  const strategies = {
    newest: (a, b) => Date.parse(b.posted_at) - Date.parse(a.posted_at),
    price_asc: (a, b) => (a.price_min_inr ?? a.price) - (b.price_min_inr ?? b.price),
    price_desc: (a, b) => (b.price_max_inr ?? b.price) - (a.price_max_inr ?? a.price),
    area_desc: (a, b) => (b.carpet_area_sqft ?? b.max_area_sqft) - (a.carpet_area_sqft ?? a.max_area_sqft),
    launch_desc: (a, b) => Date.parse(b.launch_date) - Date.parse(a.launch_date),
  };
  return strategies[sort] || strategies.newest;
}

export async function GET(request) {
  const token = request.headers.get("authorization");
  if (!token) return NextResponse.json({ detail: "Please sign in." }, { status: 401 });
  const url = new URL(request.url);
  const resource = url.searchParams.get("resource") || "listings";
  if (!new Set(["listings", "rentals", "projects"]).has(resource)) {
    return NextResponse.json({ detail: "Unknown catalog." }, { status: 400 });
  }

  try {
    const raw = await getCollection(resource, token);
    let items = resource === "listings"
      ? normalizeListings(raw.items, raw.reportedTotal)
      : resource === "rentals"
        ? normalizeRentals(raw.items)
        : normalizeProjects(raw.items);
    const allItems = items;
    const localities = [...new Set(allItems.map((item) => item.locality))].sort();
    const furnishingOptions = [...new Set(allItems.map((item) => item.furnishing).filter(Boolean))].sort();
    const statusOptions = resource === "projects"
      ? [...new Set(allItems.map((item) => item.project_status))].sort()
      : [];

    const search = url.searchParams.get("search")?.trim().toLowerCase();
    const locality = url.searchParams.get("locality");
    const bedrooms = Number(url.searchParams.get("bedrooms"));
    const furnishing = url.searchParams.get("furnishing");
    const projectStatus = url.searchParams.get("projectStatus");
    const includeFlagged = url.searchParams.get("includeFlagged") === "true";
    const inventoryStatus = url.searchParams.get("inventoryStatus") || "active";
    const minPrice = Number(url.searchParams.get("minPrice"));
    const maxPrice = Number(url.searchParams.get("maxPrice"));

    if (search) items = items.filter((item) => `${item.apartment_name} ${item.locality} ${item.developer_name || ""}`.toLowerCase().includes(search));
    if (locality) items = items.filter((item) => item.locality === locality);
    if (bedrooms) items = items.filter((item) => item.bedroom === bedrooms);
    if (furnishing) items = items.filter((item) => item.furnishing === furnishing);
    if (projectStatus) items = items.filter((item) => item.project_status === projectStatus);
    if (resource !== "projects" && inventoryStatus === "active") items = items.filter((item) => item.is_live);
    if (resource === "listings" && !includeFlagged) items = items.filter((item) => !item.flags.invalid && !item.flags.suspicious);
    if (minPrice) items = items.filter((item) => (item.price_min_inr ?? item.price) >= minPrice);
    if (maxPrice) items = items.filter((item) => (item.price_max_inr ?? item.price) <= maxPrice);
    items.sort(compare(url.searchParams.get("sort") || (resource === "projects" ? "price_desc" : "newest")));

    const pageSize = Math.min(36, Math.max(6, Number(url.searchParams.get("pageSize")) || 18));
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const start = (currentPage - 1) * pageSize;

    return NextResponse.json({
      results: items.slice(start, start + pageSize),
      count: items.length,
      page: currentPage,
      pageSize,
      totalPages,
      rawCount: allItems.length,
      reportedTotal: raw.reportedTotal,
      facets: { localities, furnishingOptions, statusOptions },
    });
  } catch (error) {
    const unauthorized = String(error.message).includes("401");
    return NextResponse.json({ detail: unauthorized ? "Your session has expired." : "The property feed could not be loaded." }, { status: unauthorized ? 401 : 502 });
  }
}
