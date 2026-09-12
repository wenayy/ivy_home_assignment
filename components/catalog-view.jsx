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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setFilters((current) => current.search === draft.search
        ? current
        : { ...current, search: draft.search });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [draft.search]);

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
  const fieldClass = "min-h-10.5 w-full rounded-[9px] border border-[#d5d9d2] bg-[#fbfbf7] px-3 text-[.87rem] text-ink outline-none focus:border-forest-light focus:ring-3 focus:ring-forest-light/10";
  const labelClass = "[&>span]:mb-1 [&>span]:ml-0.5 [&>span]:block [&>span]:text-[.74rem] [&>span]:font-bold [&>span]:text-ink-soft";
  const cardGridClass = "grid grid-cols-1 gap-4.5 transition-opacity sm:grid-cols-2 xl:grid-cols-3";

  return (
    <div className="mx-auto max-w-375 px-4 py-8 sm:px-6 lg:px-11.5 lg:py-10.5">
      <header className="mb-5 flex items-start justify-between gap-3 sm:mb-7 sm:items-end sm:gap-8">
        <div><p className="m-0 text-[.74rem] font-bold tracking-[.13em] text-forest-light uppercase">{meta.eyebrow}</p><h1 className="my-1.5 font-serif text-[clamp(2.1rem,4vw,3.35rem)] leading-none font-medium tracking-[-.045em]">{meta.title}</h1><p className="m-0 max-w-170 text-sm text-ink-soft sm:text-base">{meta.description}</p></div>
        <button className="flex min-h-10 items-center gap-1.5 rounded-[9px] border border-line bg-paper px-3 sm:hidden" onClick={() => setFilterOpen(!filterOpen)}><SlidersHorizontal size={18} />Filters</button>
      </header>

      <form className={`${filterOpen ? "grid" : "hidden"} grid-cols-1 items-end gap-3 rounded-2xl border border-line bg-paper p-4 shadow-[0_10px_34px_rgba(20,37,31,.05)] sm:grid sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-[minmax(210px,1.6fr)_repeat(6,minmax(118px,1fr))]`} onSubmit={apply}>
        <label className={`relative sm:col-span-2 2xl:col-span-1 ${labelClass}`}><Search className="absolute bottom-3 left-3 text-[#75827c]" size={18} /><input className={`${fieldClass} pl-9.5`} value={draft.search} onChange={(event) => setDraft({ ...draft, search: event.target.value })} placeholder={`Search ${meta.noun} or locality`} /></label>
        <label className={labelClass}><span>Locality</span><select className={fieldClass} value={draft.locality} onChange={(event) => setDraft({ ...draft, locality: event.target.value })}><option value="">All localities</option>{data?.facets.localities.map((value) => <option key={value} value={value}>{titleCase(value)}</option>)}</select></label>
        {resource !== "projects" && <label className={labelClass}><span>Bedrooms</span><select className={fieldClass} value={draft.bedrooms} onChange={(event) => setDraft({ ...draft, bedrooms: event.target.value })}><option value="">Any BHK</option>{[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value} BHK</option>)}</select></label>}
        {resource !== "projects" && <label className={labelClass}><span>Furnishing</span><select className={fieldClass} value={draft.furnishing} onChange={(event) => setDraft({ ...draft, furnishing: event.target.value })}><option value="">Any furnishing</option>{data?.facets.furnishingOptions.map((value) => <option key={value} value={value}>{titleCase(value)}</option>)}</select></label>}
        {resource === "projects" && <label className={labelClass}><span>Status</span><select className={fieldClass} value={draft.projectStatus} onChange={(event) => setDraft({ ...draft, projectStatus: event.target.value })}><option value="">Any status</option>{data?.facets.statusOptions.map((value) => <option key={value} value={value}>{titleCase(value)}</option>)}</select></label>}
        <label className={labelClass}><span>Min price</span><input className={fieldClass} inputMode="numeric" value={draft.minPrice} onChange={(event) => setDraft({ ...draft, minPrice: event.target.value.replace(/\D/g, "") })} placeholder={resource === "rentals" ? "₹20,000" : "₹50,00,000"} /></label>
        <label className={labelClass}><span>Max price</span><input className={fieldClass} inputMode="numeric" value={draft.maxPrice} onChange={(event) => setDraft({ ...draft, maxPrice: event.target.value.replace(/\D/g, "") })} placeholder={resource === "rentals" ? "₹80,000" : "₹3,00,00,000"} /></label>
        <label className={labelClass}><span>Sort by</span><select className={fieldClass} value={draft.sort} onChange={(event) => setDraft({ ...draft, sort: event.target.value })}>
          {resource !== "projects" && <option value="newest">Newest first</option>}
          <option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option><option value="area_desc">Largest area</option>
          {resource === "projects" && <option value="launch_desc">Newest launch</option>}
        </select></label>
        {resource === "listings" && <label className="flex items-center gap-2 pt-4 text-[.74rem] font-semibold text-ink-soft sm:col-span-2 lg:col-span-1"><input className="size-4 accent-forest" type="checkbox" checked={draft.includeFlagged} onChange={(event) => setDraft({ ...draft, includeFlagged: event.target.checked })} /><span>Include flagged records</span></label>}
        <div className="flex justify-end gap-2 sm:col-span-2"><button type="button" onClick={reset} className="border-0 bg-transparent p-2 text-[.86rem] text-ink-soft hover:text-ink">Reset</button><button className="inline-flex min-h-10 items-center gap-2 rounded-[10px] bg-forest px-3.5 text-[.86rem] font-bold text-white hover:bg-[#205243]"><Filter size={16} />Apply</button></div>
      </form>

      <div className="flex min-h-15.5 items-center justify-between px-1 text-[.88rem] text-ink-soft">
        <div><strong className="text-[.94rem] text-ink">{loading && !data ? "Loading inventory…" : `${formatNumber(data?.count || 0)} ${meta.noun}`}</strong>{data && <span> from {formatNumber(data.rawCount)} retrievable records</span>}</div>
        {resource === "listings" && <span className="inline-flex items-center gap-2 font-semibold text-forest-light before:size-2 before:rounded-full before:bg-[#3d8a6f]">Quality screen on</span>}
      </div>

      {error ? <div className="flex min-h-85 flex-col items-center justify-center rounded-2xl border border-dashed border-[#cbd0ca] px-5 py-12 text-center text-ink-soft"><AlertCircle size={26} /><h2 className="mt-3 mb-1 font-serif text-2xl font-medium text-ink">We couldn’t load this view</h2><p className="mb-4">{error}</p><button onClick={load} className="inline-flex min-h-11 items-center rounded-[10px] border border-[#cbd2cc] bg-paper px-4 font-bold text-forest hover:border-forest">Try again</button></div>
        : loading && !data ? <div className={cardGridClass}>{Array.from({ length: 9 }).map((_, index) => <div className="skeleton-shimmer h-91 rounded-2xl border border-line" key={index} />)}</div>
          : data?.results.length ? <div className={`${cardGridClass} ${loading ? "opacity-50" : ""}`}>{data.results.map((item) => <Card key={item.listing_id || item.project_id} item={item} />)}</div>
            : <div className="flex min-h-85 flex-col items-center justify-center rounded-2xl border border-dashed border-[#cbd0ca] px-5 py-12 text-center text-ink-soft"><Search size={28} /><h2 className="mt-3 mb-1 font-serif text-2xl font-medium text-ink">No exact matches</h2><p className="mb-4">Try widening the price range or removing a filter.</p><button onClick={reset} className="inline-flex min-h-11 items-center rounded-[10px] border border-[#cbd2cc] bg-paper px-4 font-bold text-forest hover:border-forest">Clear filters</button></div>}

      {data && data.totalPages > 1 && <nav className="flex items-center justify-center gap-4 pt-7.5 text-[.84rem] text-ink-soft" aria-label="Results pages">
        <button className="flex min-h-10 items-center gap-1 rounded-[9px] border border-line bg-paper px-3 text-ink" disabled={page <= 1 || loading} onClick={() => { setPage(page - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}><ChevronLeft size={18} />Previous</button>
        <span>Page <strong>{data.page}</strong> of {data.totalPages}</span>
        <button className="flex min-h-10 items-center gap-1 rounded-[9px] border border-line bg-paper px-3 text-ink" disabled={page >= data.totalPages || loading} onClick={() => { setPage(page + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Next<ChevronRight size={18} /></button>
      </nav>}
    </div>
  );
}
