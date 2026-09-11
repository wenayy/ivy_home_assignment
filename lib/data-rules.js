export const SQM_TO_SQFT = 10.7639104167;

export function listingCarpetAreaSqft(listing) {
  return listing.website === "magichomes" && listing.carpet_area < 300
    ? listing.carpet_area * SQM_TO_SQFT
    : listing.carpet_area;
}

export function listingSuperAreaSqft(listing) {
  return listing.website === "magichomes" && listing.super_built_up_area < 400
    ? listing.super_built_up_area * SQM_TO_SQFT
    : listing.super_built_up_area;
}

export function projectPriceInr(value) {
  if (value == null) return null;
  return Math.round(value * (value < 10 ? 10_000_000 : 100_000));
}

export function rentalDepositInr(rental) {
  return rental.website === "zerobroker"
    ? rental.deposit * rental.price
    : rental.deposit;
}

export function canonicalPropertyName(value) {
  return value
    .toLowerCase()
    .replace(/\b(the|phase\s*1|apartments?)\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

export function numericListingSequence(listing) {
  return Number(listing.listing_id.match(/\d+$/)?.[0]) - 1_000_000;
}

