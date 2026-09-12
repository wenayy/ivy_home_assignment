"use client";

import Link from "next/link";
import { ArrowUpRight, Bath, BedDouble, Building2, MapPin, Ruler } from "lucide-react";
import { formatDate, formatInr, titleCase } from "../lib/format";
import SaveButton from "./save-button";

function CardVisual({ item, type, detailHref, initialSaved, onSaveChange }) {
  const initials = item.apartment_name.split(/\s+/).slice(0, 2).map((word) => word[0]).join("");
  return (
    <div className={`card-visual visual-${type}`}>
      <span className="visual-grid" />
      <span className="building-initials">{initials}</span>
      <span className="source-chip">{item.website || item.developer_name}</span>
      {detailHref && <Link className="card-visual-link" href={detailHref} aria-label={`View ${item.apartment_name}`} />}
      {type === "listing" && <SaveButton listingId={item.listing_id} initialSaved={initialSaved} onChange={onSaveChange} compact />}
    </div>
  );
}

export function ListingCard({ item, initialSaved = false, onSaveChange }) {
  const detailHref = `/listings/${encodeURIComponent(item.listing_id)}`;
  return (
    <article className="property-card">
      <CardVisual item={item} type="listing" detailHref={detailHref} initialSaved={initialSaved} onSaveChange={onSaveChange} />
      <Link href={detailHref} className="card-content">
        <div className="price-row"><strong>{formatInr(item.price)}</strong><span>{item.is_verified ? "Checked source" : "Source listed"}</span></div>
        <h3>{titleCase(item.apartment_name)}</h3>
        <p className="location"><MapPin size={15} />{titleCase(item.locality)}</p>
        <div className="property-meta">
          <span><BedDouble size={16} />{item.bedroom || "Plot"}{item.bedroom ? " BHK" : ""}</span>
          {item.bedroom > 0 && <span><Bath size={16} />{item.bathroom} bath</span>}
          <span><Ruler size={16} />{item.carpet_area_sqft.toLocaleString("en-IN")} sq ft</span>
        </div>
        <div className="card-foot"><span>Posted {formatDate(item.posted_at)}</span><ArrowUpRight size={17} /></div>
      </Link>
    </article>
  );
}

export function RentalCard({ item }) {
  return (
    <article className="property-card static-card">
      <CardVisual item={item} type="rental" />
      <div className="card-content">
        <div className="price-row"><strong>{formatInr(item.price, { compact: false })}<small>/month</small></strong><span>{item.is_live ? "Available" : "Inactive"}</span></div>
        <h3>{titleCase(item.apartment_name)}</h3>
        <p className="location"><MapPin size={15} />{titleCase(item.locality)}</p>
        <div className="property-meta">
          <span><BedDouble size={16} />{item.bedroom} BHK</span>
          <span><Bath size={16} />{item.bathroom} bath</span>
          <span><Ruler size={16} />{item.carpet_area_sqft.toLocaleString("en-IN")} sq ft</span>
        </div>
        <div className="rent-breakdown"><span>Deposit</span><strong>{formatInr(item.deposit_inr)}</strong><span>Maintenance</span><strong>{formatInr(item.maintenance, { compact: false })}</strong></div>
      </div>
    </article>
  );
}

export function ProjectCard({ item }) {
  return (
    <article className="property-card static-card project-card">
      <CardVisual item={item} type="project" />
      <div className="card-content">
        <div className="price-row"><strong>{formatInr(item.price_min_inr)} – {formatInr(item.price_max_inr)}</strong><span>{titleCase(item.project_status)}</span></div>
        <h3>{titleCase(item.apartment_name)}</h3>
        <p className="location"><MapPin size={15} />{titleCase(item.locality)} · {item.developer_name}</p>
        <div className="property-meta">
          <span><Building2 size={16} />{item.total_towers} towers</span>
          <span><Ruler size={16} />{item.min_area_sqft.toLocaleString("en-IN")}–{item.max_area_sqft.toLocaleString("en-IN")} sq ft</span>
        </div>
        <div className="card-foot"><span>Possession {formatDate(item.possession_date)}</span><span>{item.total_listings} listed</span></div>
      </div>
    </article>
  );
}
