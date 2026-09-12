import {
  listingCarpetAreaSqft,
  listingSuperAreaSqft,
  numericListingSequence,
  projectPriceInr,
  rentalDepositInr,
} from "./data-rules";

const BASE_URL = process.env.IVY_BASE_URL || "https://solve.ivy.homes";
const CACHE_MS = 5 * 60 * 1000;
const cache = globalThis.__ivyCatalogCache || new Map();
globalThis.__ivyCatalogCache = cache;

async function upstreamPage(resource, offset, token) {
  const response = await fetch(`${BASE_URL}/v1/${resource}?limit=50&offset=${offset}`, {
    headers: {
      "X-API-Key": process.env.IVY_API_KEY,
      Authorization: token,
    },
    cache: "no-store",
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Upstream ${resource} request failed (${response.status}): ${body}`);
  }
  return response.json();
}

async function fetchAll(resource, token) {
  const first = await upstreamPage(resource, 0, token);
  const offsets = [];
  for (let offset = first.limit; offset < first.total; offset += first.limit) offsets.push(offset);

  const pages = [first];
  for (let index = 0; index < offsets.length; index += 20) {
    const batch = offsets.slice(index, index + 20);
    pages.push(...await Promise.all(batch.map((offset) => upstreamPage(resource, offset, token))));
  }

  pages.sort((left, right) => left.offset - right.offset);
  let tail = pages.at(-1);
  let nextOffset = tail.offset + tail.count;
  while (tail.has_more) {
    tail = await upstreamPage(resource, nextOffset, token);
    pages.push(tail);
    nextOffset += tail.count;
    if (!tail.count) break;
  }

  return {
    reportedTotal: first.total,
    items: pages.flatMap((page) => page.results),
  };
}

export async function getCollection(resource, token) {
  const cached = cache.get(resource);
  if (cached && Date.now() - cached.createdAt < CACHE_MS) return cached.promise;
  const promise = fetchAll(resource, token).catch((error) => {
    cache.delete(resource);
    throw error;
  });
  cache.set(resource, { createdAt: Date.now(), promise });
  return promise;
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function invalidListing(item) {
  const carpet = listingCarpetAreaSqft(item);
  const superArea = listingSuperAreaSqft(item);
  return item.price < 100_000
    || carpet > superArea
    || item.floor > item.total_floors
    || (item.bedroom === 0 && item.property_type !== "plot")
    || item.latitude > 20
    || item.longitude < 20
    || Date.parse(item.posted_at) > Date.parse("2026-09-12T23:59:59+05:30");
}

export function normalizeListings(items, reportedTotal) {
  const phoneGroups = new Map();
  for (const item of items) {
    const group = phoneGroups.get(item.posted_by_contact) || [];
    group.push(item);
    phoneGroups.set(item.posted_by_contact, group);
  }
  const suspiciousPhones = new Set(
    [...phoneGroups.entries()]
      .filter(([, group]) => group.length >= 20)
      .filter(([, group]) => group.every((item) => item.posted_by === "agent" && item.is_verified))
      .filter(([, group]) => median(group.map((item) => item.price / listingCarpetAreaSqft(item))) < 7_000)
      .map(([phone]) => phone),
  );

  return items.map((item) => ({
    ...item,
    carpet_area_sqft: Math.round(listingCarpetAreaSqft(item)),
    super_built_up_area_sqft: Math.round(listingSuperAreaSqft(item)),
    flags: {
      invalid: invalidListing(item),
      suspicious: suspiciousPhones.has(item.posted_by_contact),
      duplicate: numericListingSequence(item) > reportedTotal,
      inactive: !item.is_live,
      converted_area: item.website === "magichomes" && item.carpet_area < 300,
    },
  }));
}

export function normalizeRentals(items) {
  return items.map((item) => ({
    ...item,
    display_title: `${item.bedroom} BHK for rent in ${titleCase(item.locality)}`,
    carpet_area_sqft: item.carpet_area,
    super_builtup_area_sqft: item.super_builtup_area,
    deposit_inr: rentalDepositInr(item),
    flags: {
      title_mismatch: item.title.replace(/^\d+ BHK for rent in /, "").toLowerCase() !== item.locality,
      converted_deposit: item.website === "zerobroker",
      inactive: !item.is_live,
    },
  }));
}

export function normalizeProjects(items) {
  return items.map((item) => ({
    ...item,
    price_min_inr: projectPriceInr(item.price_min),
    price_max_inr: projectPriceInr(item.price_max),
  }));
}

export function titleCase(value) {
  return value.replace(/\b\w/g, (character) => character.toUpperCase());
}

