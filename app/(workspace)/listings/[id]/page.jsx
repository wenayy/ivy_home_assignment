"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Bath, BedDouble, Building, CalendarDays, Car, CheckCircle2, Compass, ExternalLink, MapPin, Ruler, ShieldAlert } from "lucide-react";
import { apiJson } from "../../../../lib/client-api";
import { listingCarpetAreaSqft, listingSuperAreaSqft } from "../../../../lib/data-rules";
import { formatDate, formatInr, titleCase } from "../../../../lib/format";
import SaveButton from "../../../../components/save-button";

export default function ListingDetailPage({ params }) {
  const { id } = use(params);
  const [listing, setListing] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      apiJson(`/api/ivy/v1/listings/${encodeURIComponent(id)}`),
      apiJson("/api/ivy/v1/saved").catch(() => ({ results: [] })),
    ]).then(([item, savedData]) => {
      setListing(item);
      setSaved(savedData.results.some((entry) => entry.listing_id === item.listing_id));
    }).catch((nextError) => setError(nextError.message));
  }, [id]);

  const areas = useMemo(() => listing ? {
    carpet: Math.round(listingCarpetAreaSqft(listing)),
    superArea: Math.round(listingSuperAreaSqft(listing)),
    converted: listing.website === "magichomes" && listing.carpet_area < 300,
  } : null, [listing]);

  if (error) return <div className="page-wrap"><Link className="back-link" href="/listings"><ArrowLeft size={17} />Back to homes</Link><div className="error-state"><ShieldAlert size={28} /><h1>Listing unavailable</h1><p>{error}</p></div></div>;
  if (!listing) return <div className="detail-loading"><span className="spinner" />Loading property details…</div>;

  const inactive = !listing.is_live;
  const sourceUrl = /^https?:\/\//i.test(listing.listing_url)
    ? listing.listing_url
    : `https://${listing.listing_url}`;
  return (
    <div className="page-wrap detail-page">
      <Link className="back-link" href="/listings"><ArrowLeft size={17} />Back to homes</Link>
      <div className="detail-hero">
        <div className="detail-art"><span>{listing.apartment_name.split(/\s+/).slice(0, 2).map((word) => word[0]).join("")}</span><small>{listing.website}</small></div>
        <div className="detail-summary">
          <div className="detail-kicker"><span>{titleCase(listing.property_type)}</span>{listing.is_verified && <span><CheckCircle2 size={14} />Checked source</span>}{inactive && <span className="danger-chip">Inactive</span>}</div>
          <h1>{titleCase(listing.apartment_name)}</h1>
          <p className="detail-location"><MapPin size={18} />{titleCase(listing.locality)}, Bangalore</p>
          <div className="detail-price"><strong>{formatInr(listing.price)}</strong><span>{formatInr(listing.price / areas.carpet, { compact: false })} / sq ft</span></div>
          <SaveButton listingId={listing.listing_id} initialSaved={saved} />
        </div>
      </div>

      {inactive && <div className="notice warning"><ShieldAlert size={20} /><div><strong>This listing is no longer active.</strong><span>It remains reachable for reference, but it is excluded from the main search.</span></div></div>}
      {areas.converted && <div className="notice"><Ruler size={20} /><div><strong>Area converted to square feet.</strong><span>The source supplied this record in square metres; the values below are normalized.</span></div></div>}

      <div className="detail-grid">
        <section className="detail-main">
          <div className="fact-grid">
            <div><BedDouble /><span>Bedrooms</span><strong>{listing.bedroom || "Plot"}</strong></div>
            <div><Bath /><span>Bathrooms</span><strong>{listing.bathroom || "—"}</strong></div>
            <div><Ruler /><span>Carpet area</span><strong>{areas.carpet.toLocaleString("en-IN")} sq ft</strong></div>
            <div><Building /><span>Floor</span><strong>{listing.floor} of {listing.total_floors}</strong></div>
            <div><Car /><span>Covered parking</span><strong>{listing.covered_parking}</strong></div>
            <div><Compass /><span>Facing</span><strong>{titleCase(listing.facing_direction)}</strong></div>
          </div>
          <div className="detail-section"><p className="eyebrow">About this home</p><h2>Property notes</h2><p className="description-text">{listing.description}</p></div>
          <div className="detail-section"><p className="eyebrow">Dimensions</p><h2>Area breakdown</h2><div className="area-comparison"><div><span>Carpet area</span><strong>{areas.carpet.toLocaleString("en-IN")} sq ft</strong></div><div><span>Super built-up</span><strong>{areas.superArea.toLocaleString("en-IN")} sq ft</strong></div></div></div>
        </section>
        <aside className="detail-aside">
          <p className="eyebrow">Listing record</p>
          <dl><div><dt>Furnishing</dt><dd>{titleCase(listing.furnishing)}</dd></div><div><dt>Posted by</dt><dd>{titleCase(listing.posted_by)}</dd></div><div><dt>Posted on</dt><dd><CalendarDays size={15} />{formatDate(listing.posted_at)}</dd></div><div><dt>Listing ID</dt><dd>{listing.listing_id}</dd></div></dl>
          <a href={sourceUrl} target="_blank" rel="noreferrer" className="secondary-button full">View original source<ExternalLink size={16} /></a>
        </aside>
      </div>
    </div>
  );
}
