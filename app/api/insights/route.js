import { NextResponse } from "next/server";
import { getCollection, normalizeListings, normalizeProjects, normalizeRentals } from "../../../lib/server-data";

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export async function GET(request) {
  const token = request.headers.get("authorization");
  if (!token) return NextResponse.json({ detail: "Please sign in." }, { status: 401 });
  try {
    const [listingRaw, rentalRaw, projectRaw] = await Promise.all([
      getCollection("listings", token), getCollection("rentals", token), getCollection("projects", token),
    ]);
    const listings = normalizeListings(listingRaw.items, listingRaw.reportedTotal);
    const rentals = normalizeRentals(rentalRaw.items);
    const projects = normalizeProjects(projectRaw.items);
    const trusted = listings.filter((item) => item.is_live && !item.flags.invalid && !item.flags.suspicious);
    const byLocality = [...new Set(trusted.map((item) => item.locality))].map((locality) => {
      const group = trusted.filter((item) => item.locality === locality);
      return { locality, count: group.length, median_price: median(group.map((item) => item.price)) };
    }).sort((a, b) => b.count - a.count);
    const byBhk = [...new Set(trusted.map((item) => item.bedroom))].sort((a, b) => a - b).map((bedroom) => ({ bedroom, count: trusted.filter((item) => item.bedroom === bedroom).length }));
    const liveCounts = new Map();
    for (const item of listings.filter((entry) => entry.is_live && entry.project_id)) liveCounts.set(item.project_id, (liveCounts.get(item.project_id) || 0) + 1);
    const wrongProjects = projects.filter((item) => item.total_listings !== (liveCounts.get(item.project_id) || 0));
    const titleMismatches = rentals.filter((item) => item.flags.title_mismatch).length;
    return NextResponse.json({
      city: "bangalore",
      total_listings: listings.length,
      active_listings: listings.filter((item) => item.is_live).length,
      trusted_active_listings: trusted.length,
      unique_properties: listingRaw.reportedTotal,
      median_price: median(trusted.map((item) => item.price)),
      median_price_per_sqft: Math.round(median(trusted.map((item) => item.price / item.carpet_area_sqft))),
      by_locality: byLocality,
      by_bhk: byBhk,
      discoveries: {
        hidden_listing_records: listings.length - listingRaw.reportedTotal,
        inactive_records: listings.filter((item) => !item.is_live).length,
        impossible_records: listings.filter((item) => item.flags.invalid).length,
        suspicious_records: listings.filter((item) => item.flags.suspicious).length,
        converted_area_records: listings.filter((item) => item.flags.converted_area).length,
        converted_deposit_records: rentals.filter((item) => item.flags.converted_deposit).length,
        rental_title_mismatches: titleMismatches,
        wrong_project_counts: wrongProjects.length,
      },
    });
  } catch (error) {
    const unauthorized = String(error.message).includes("401");
    return NextResponse.json({ detail: unauthorized ? "Your session has expired." : "Insights could not be calculated." }, { status: unauthorized ? 401 : 502 });
  }
}

