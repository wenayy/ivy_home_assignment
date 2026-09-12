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
    <div className="page-wrap">
      <header className="page-header"><div><p className="eyebrow">Your shortlist</p><h1>Saved homes</h1><p>These homes are tied to your demo account and stay saved after you sign out.</p></div></header>
      {error ? <div className="error-state"><Heart size={28} /><h2>Saved homes unavailable</h2><p>{error}</p><button onClick={load} className="secondary-button">Try again</button></div>
        : items === null ? <div className="card-grid">{Array.from({ length: 3 }).map((_, index) => <div className="card-skeleton" key={index} />)}</div>
          : items.length ? <><div className="results-head"><div><strong>{items.length} saved {items.length === 1 ? "home" : "homes"}</strong></div></div><div className="card-grid">{items.map((item) => <ListingCard key={item.listing_id} item={item} initialSaved onSaveChange={(saved) => { if (!saved) setItems((current) => current.filter((entry) => entry.listing_id !== item.listing_id)); }} />)}</div></>
            : <div className="empty-state"><Search size={28} /><h2>Your shortlist is empty</h2><p>Save homes while browsing and they’ll appear here.</p><Link href="/listings" className="secondary-button">Browse homes</Link></div>}
    </div>
  );
}
