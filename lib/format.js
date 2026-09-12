export function formatInr(value, { compact = true } = {}) {
  if (value == null || Number.isNaN(value)) return "—";
  if (compact) {
    if (Math.abs(value) >= 10_000_000) return `₹${(value / 10_000_000).toFixed(value % 10_000_000 ? 2 : 0)} Cr`;
    if (Math.abs(value) >= 100_000) return `₹${(value / 100_000).toFixed(value % 100_000 ? 1 : 0)} L`;
  }
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

export function formatNumber(value) {
  return new Intl.NumberFormat("en-IN").format(value);
}

export function titleCase(value = "") {
  return value.replace(/\b\w/g, (character) => character.toUpperCase());
}

export function formatDate(value) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(value));
}

