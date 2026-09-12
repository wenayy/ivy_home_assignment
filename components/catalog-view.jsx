"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, ChevronLeft, ChevronRight, Filter, Search, SlidersHorizontal } from "lucide-react";
import { apiJson } from "../lib/client-api";
import { formatNumber, titleCase } from "../lib/format";
import { ListingCard, ProjectCard, RentalCard } from "./catalog-card";

const copy = {
  listings: { eyebrow: "Verified view", title: "Homes for sale", description: "Active Bangalore inventory with suspicious and impossible records screened out.", noun: "homes" },
  rentals: { eyebrow: "Move-in options", title: "Homes for rent", description: "Monthly rents, deposits and areas translated into consistent units.", noun: "rentals" },
  projects: { eyebrow: "Builder inventory", title: "Residential projects", description: "Compare projects using prices normalized to rupees, whether the source used lakhs or crores.", noun: "projects" },
};

export default function CatalogView({ resource }) {
  const meta = copy[resource];
  const [draft, setDraft] = useState({ search: "", locality: "", bedrooms: "", furnishing: "", projectStatus: "", minPrice: "", maxPrice: "", sort: resource === "projects" ? "price_desc" : "newest", inventoryStatus: "active", includeFlagged: false });
  const [filters, setFilters] = useState(draft);
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  const query = useMemo(() => {
    const params = new URLSearchParams({ resource, page: String(page), pageSize: "18" });
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== "" && value !== false) params.set(key, String(value));
    });
    return params.toString();
  }, [filters, page, resource]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try { setData(await apiJson(`/api/catalog?${query}`)); }
    catch (nextError) { setError(nextError.message); }
    finally { setLoading(false); }
  }, [query]);

  useEffect(() => { load(); }, [load]);

  function apply(event) {
    event?.preventDefault();
    setPage(1);
    setFilters(draft);
    setFilterOpen(false);
  }

  function reset() {
    const next = { search: "", locality: "", bedrooms: "", furnishing: "", projectStatus: "", minPrice: "", maxPrice: "", sort: resource === "projects" ? "price_desc" : "newest", inventoryStatus: "active", includeFlagged: false };
    setDraft(next); setFilters(next); setPage(1);
  }

  const Card = resource === "listings" ? ListingCard : resource === "rentals" ? RentalCard : ProjectCard;

  return (
    <div className="page-wrap">
      <header className="page-header">
        <div><p className="eyebrow">{meta.eyebrow}</p><h1>{meta.title}</h1><p>{meta.description}</p></div>
        <button className="filter-toggle" onClick={() => setFilterOpen(!filterOpen)}><SlidersHorizontal size={18} />Filters</button>
      </header>

      <form className={`filter-bar ${filterOpen ? "open" : ""}`} onSubmit={apply}>
        <label className="search-field"><Search size={18} /><input value={draft.search} onChange={(event) => setDraft({ ...draft, search: event.target.value })} placeholder={`Search ${meta.noun} or locality`} /></label>
        <label><span>Locality</span><select value={draft.locality} onChange={(event) => setDraft({ ...draft, locality: event.target.value })}><option value="">All localities</option>{data?.facets.localities.map((value) => <option key={value} value={value}>{titleCase(value)}</option>)}</select></label>
        {resource !== "projects" && <label><span>Bedrooms</span><select value={draft.bedrooms} onChange={(event) => setDraft({ ...draft, bedrooms: event.target.value })}><option value="">Any BHK</option>{[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value} BHK</option>)}</select></label>}
        {resource !== "projects" && <label><span>Furnishing</span><select value={draft.furnishing} onChange={(event) => setDraft({ ...draft, furnishing: event.target.value })}><option value="">Any furnishing</option>{data?.facets.furnishingOptions.map((value) => <option key={value} value={value}>{titleCase(value)}</option>)}</select></label>}
        {resource === "projects" && <label><span>Status</span><select value={draft.projectStatus} onChange={(event) => setDraft({ ...draft, projectStatus: event.target.value })}><option value="">Any status</option>{data?.facets.statusOptions.map((value) => <option key={value} value={value}>{titleCase(value)}</option>)}</select></label>}
        <label><span>Min price</span><input inputMode="numeric" value={draft.minPrice} onChange={(event) => setDraft({ ...draft, minPrice: event.target.value.replace(/\D/g, "") })} placeholder={resource === "rentals" ? "₹20,000" : "₹50,00,000"} /></label>
        <label><span>Max price</span><input inputMode="numeric" value={draft.maxPrice} onChange={(event) => setDraft({ ...draft, maxPrice: event.target.value.replace(/\D/g, "") })} placeholder={resource === "rentals" ? "₹80,000" : "₹3,00,00,000"} /></label>
        <label><span>Sort by</span><select value={draft.sort} onChange={(event) => setDraft({ ...draft, sort: event.target.value })}>
          {resource !== "projects" && <option value="newest">Newest first</option>}
          <option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option><option value="area_desc">Largest area</option>
          {resource === "projects" && <option value="launch_desc">Newest launch</option>}
        </select></label>
        {resource === "listings" && <label className="check-field"><input type="checkbox" checked={draft.includeFlagged} onChange={(event) => setDraft({ ...draft, includeFlagged: event.target.checked })} /><span>Include flagged records</span></label>}
        <div className="filter-actions"><button type="button" onClick={reset} className="text-button">Reset</button><button className="primary-button compact"><Filter size={16} />Apply</button></div>
      </form>

      <div className="results-head">
        <div><strong>{loading && !data ? "Loading inventory…" : `${formatNumber(data?.count || 0)} ${meta.noun}`}</strong>{data && <span> from {formatNumber(data.rawCount)} retrievable records</span>}</div>
        {resource === "listings" && <span className="screened-note">Quality screen on</span>}
      </div>

      {error ? <div className="error-state"><AlertCircle size={26} /><h2>We couldn’t load this view</h2><p>{error}</p><button onClick={load} className="secondary-button">Try again</button></div>
        : loading && !data ? <div className="card-grid">{Array.from({ length: 9 }).map((_, index) => <div className="card-skeleton" key={index} />)}</div>
          : data?.results.length ? <div className={`card-grid ${loading ? "updating" : ""}`}>{data.results.map((item) => <Card key={item.listing_id || item.project_id} item={item} />)}</div>
            : <div className="empty-state"><Search size={28} /><h2>No exact matches</h2><p>Try widening the price range or removing a filter.</p><button onClick={reset} className="secondary-button">Clear filters</button></div>}

      {data && data.totalPages > 1 && <nav className="pagination" aria-label="Results pages">
        <button disabled={page <= 1 || loading} onClick={() => { setPage(page - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}><ChevronLeft size={18} />Previous</button>
        <span>Page <strong>{data.page}</strong> of {data.totalPages}</span>
        <button disabled={page >= data.totalPages || loading} onClick={() => { setPage(page + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Next<ChevronRight size={18} /></button>
      </nav>}
    </div>
  );
}

