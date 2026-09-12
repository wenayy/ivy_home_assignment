"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Search } from "lucide-react";
import { apiJson } from "../../../lib/client-api";
import { listingCarpetAreaSqft, listingSuperAreaSqft } from "../../../lib/data-rules";
import { ListingCard } from "../../../components/catalog-card";

export default function SavedPage() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      const data = await apiJson("/api/ivy/v1/saved");
      setItems(data.results.map((item) => ({
        ...item,
        carpet_area_sqft: Math.round(listingCarpetAreaSqft(item)),
        super_built_up_area_sqft: Math.round(listingSuperAreaSqft(item)),
      })));
    } catch (nextError) { setError(nextError.message); }
  }
  useEffect(() => { load(); }, []);

  return (
    <div className="mx-auto max-w-375 px-4 py-8 sm:px-6 lg:px-11.5 lg:py-10.5">
      <header className="mb-7"><div><p className="m-0 text-[.74rem] font-bold tracking-[.13em] text-forest-light uppercase">Your shortlist</p><h1 className="my-1.5 font-serif text-[clamp(2.1rem,4vw,3.35rem)] leading-none font-medium tracking-[-.045em]">Saved homes</h1><p className="m-0 max-w-170 text-ink-soft">These homes are tied to your demo account and stay saved after you sign out.</p></div></header>
      {error ? <div className="flex min-h-85 flex-col items-center justify-center rounded-2xl border border-dashed border-[#cbd0ca] p-12 text-center text-ink-soft"><Heart size={28} /><h2 className="mt-3 mb-1 font-serif text-2xl text-ink">Saved homes unavailable</h2><p className="mb-4">{error}</p><button onClick={load} className="inline-flex min-h-11 items-center rounded-[10px] border border-[#cbd2cc] bg-paper px-4 font-bold text-forest hover:border-forest">Try again</button></div>
        : items === null ? <div className="grid grid-cols-1 gap-4.5 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 3 }).map((_, index) => <div className="skeleton-shimmer h-91 rounded-2xl border border-line" key={index} />)}</div>
          : items.length ? <><div className="flex min-h-15.5 items-center px-1 text-[.94rem]"><strong>{items.length} saved {items.length === 1 ? "home" : "homes"}</strong></div><div className="grid grid-cols-1 gap-4.5 sm:grid-cols-2 xl:grid-cols-3">{items.map((item) => <ListingCard key={item.listing_id} item={item} initialSaved onSaveChange={(saved) => { if (!saved) setItems((current) => current.filter((entry) => entry.listing_id !== item.listing_id)); }} />)}</div></>
            : <div className="flex min-h-85 flex-col items-center justify-center rounded-2xl border border-dashed border-[#cbd0ca] p-12 text-center text-ink-soft"><Search size={28} /><h2 className="mt-3 mb-1 font-serif text-2xl text-ink">Your shortlist is empty</h2><p className="mb-4">Save homes while browsing and they’ll appear here.</p><Link href="/listings" className="inline-flex min-h-11 items-center rounded-[10px] border border-[#cbd2cc] bg-paper px-4 font-bold text-forest hover:border-forest">Browse homes</Link></div>}
    </div>
  );
}
