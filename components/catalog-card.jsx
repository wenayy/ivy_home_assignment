"use client";

import Link from "next/link";
import { ArrowUpRight, Bath, BedDouble, Building2, MapPin, Ruler } from "lucide-react";
import { formatDate, formatInr, titleCase } from "../lib/format";
import SaveButton from "./save-button";

function CardVisual({ item, type, detailHref, initialSaved, onSaveChange }) {
  const initials = item.apartment_name.split(/\s+/).slice(0, 2).map((word) => word[0]).join("");
  const background = type === "rental" ? "bg-[#e4d4b2]" : type === "project" ? "bg-[#c8d1dc]" : "bg-[#cadbd2]";
  return (
    <div className={`relative h-31 overflow-hidden sm:h-31.5 ${background} after:absolute after:-top-18 after:-right-11 after:size-40 after:rounded-full after:border-24 after:border-white/30`}>
      <span className="card-pattern absolute inset-0 rotate-[-7deg] scale-120 opacity-40" />
      <span className="absolute bottom-3 left-4.5 font-serif text-[2.4rem] font-bold tracking-[-.08em] text-ink/75">{initials}</span>
      <span className="absolute top-3 left-3 max-w-[65%] rounded-md bg-white/80 px-2 py-1 text-[.68rem] font-bold text-ink-soft capitalize backdrop-blur-sm">{item.website || item.developer_name}</span>
      {detailHref && <Link className="absolute inset-0 z-1" href={detailHref} aria-label={`View ${item.apartment_name}`} />}
      {type === "listing" && <SaveButton listingId={item.listing_id} initialSaved={initialSaved} onChange={onSaveChange} compact />}
    </div>
  );
}

export function ListingCard({ item, initialSaved = false, onSaveChange }) {
  const detailHref = `/listings/${encodeURIComponent(item.listing_id)}`;
  return (
    <article className="min-w-0 overflow-hidden rounded-2xl border border-line bg-paper transition hover:-translate-y-0.5 hover:border-[#c4ccc5] hover:shadow-card">
      <CardVisual item={item} type="listing" detailHref={detailHref} initialSaved={initialSaved} onSaveChange={onSaveChange} />
      <Link href={detailHref} className="block px-4.5 pt-4 pb-3.5">
        <div className="flex items-center justify-between gap-2.5"><strong className="text-[1.08rem] tracking-tight">{formatInr(item.price)}</strong><span className="rounded-md bg-mint px-2 py-1 text-right text-[.66rem] font-bold text-forest-light">{item.is_verified ? "Checked source" : "Source listed"}</span></div>
        <h3 className="mt-3 mb-1 truncate font-serif text-lg font-semibold">{titleCase(item.apartment_name)}</h3>
        <p className="m-0 flex items-center gap-1 text-[.82rem] text-ink-soft"><MapPin size={15} />{titleCase(item.locality)}</p>
        <div className="mt-1 flex flex-wrap gap-3 border-b border-[#e8e8e1] py-3.5 text-[.76rem] text-[#51615a] [&>span]:inline-flex [&>span]:items-center [&>span]:gap-1">
          <span><BedDouble size={16} />{item.bedroom || "Plot"}{item.bedroom ? " BHK" : ""}</span>
          {item.bedroom > 0 && <span><Bath size={16} />{item.bathroom} bath</span>}
          <span><Ruler size={16} />{item.carpet_area_sqft.toLocaleString("en-IN")} sq ft</span>
        </div>
        <div className="flex items-center justify-between pt-3 text-[.72rem] text-[#68766f]"><span>Posted {formatDate(item.posted_at)}</span><ArrowUpRight size={17} /></div>
      </Link>
    </article>
  );
}

export function RentalCard({ item }) {
  return (
    <article className="min-w-0 overflow-hidden rounded-2xl border border-line bg-paper transition hover:-translate-y-0.5 hover:border-[#c4ccc5] hover:shadow-card">
      <CardVisual item={item} type="rental" />
      <div className="block px-4.5 pt-4 pb-3.5">
        <div className="flex items-center justify-between gap-2.5"><strong className="text-[1.08rem] tracking-tight">{formatInr(item.price, { compact: false })}<small className="ml-0.5 text-[.7rem] font-medium text-ink-soft">/month</small></strong><span className="rounded-md bg-mint px-2 py-1 text-[.66rem] font-bold text-forest-light">{item.is_live ? "Available" : "Inactive"}</span></div>
        <h3 className="mt-3 mb-1 truncate font-serif text-lg font-semibold">{titleCase(item.apartment_name)}</h3>
        <p className="m-0 flex items-center gap-1 text-[.82rem] text-ink-soft"><MapPin size={15} />{titleCase(item.locality)}</p>
        <div className="mt-1 flex flex-wrap gap-3 border-b border-[#e8e8e1] py-3.5 text-[.76rem] text-[#51615a] [&>span]:inline-flex [&>span]:items-center [&>span]:gap-1">
          <span><BedDouble size={16} />{item.bedroom} BHK</span>
          <span><Bath size={16} />{item.bathroom} bath</span>
          <span><Ruler size={16} />{item.carpet_area_sqft.toLocaleString("en-IN")} sq ft</span>
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 pt-3 text-[.76rem] text-ink-soft [&>strong]:text-right [&>strong]:text-ink"><span>Deposit</span><strong>{formatInr(item.deposit_inr)}</strong><span>Maintenance</span><strong>{formatInr(item.maintenance, { compact: false })}</strong></div>
      </div>
    </article>
  );
}

export function ProjectCard({ item }) {
  return (
    <article className="min-w-0 overflow-hidden rounded-2xl border border-line bg-paper transition hover:-translate-y-0.5 hover:border-[#c4ccc5] hover:shadow-card">
      <CardVisual item={item} type="project" />
      <div className="block px-4.5 pt-4 pb-3.5">
        <div className="flex items-center justify-between gap-2.5"><strong className="text-[1.08rem] tracking-tight">{formatInr(item.price_min_inr)} – {formatInr(item.price_max_inr)}</strong><span className="rounded-md bg-mint px-2 py-1 text-[.66rem] font-bold text-forest-light">{titleCase(item.project_status)}</span></div>
        <h3 className="mt-3 mb-1 truncate font-serif text-lg font-semibold">{titleCase(item.apartment_name)}</h3>
        <p className="m-0 flex items-center gap-1 text-[.82rem] text-ink-soft"><MapPin size={15} />{titleCase(item.locality)} · {item.developer_name}</p>
        <div className="mt-1 flex flex-wrap gap-3 border-b border-[#e8e8e1] py-3.5 text-[.76rem] text-[#51615a] [&>span]:inline-flex [&>span]:items-center [&>span]:gap-1">
          <span><Building2 size={16} />{item.total_towers} towers</span>
          <span><Ruler size={16} />{item.min_area_sqft.toLocaleString("en-IN")}–{item.max_area_sqft.toLocaleString("en-IN")} sq ft</span>
        </div>
        <div className="flex items-center justify-between pt-3 text-[.72rem] text-[#68766f]"><span>Possession {formatDate(item.possession_date)}</span><span>{item.total_listings} listed</span></div>
      </div>
    </article>
  );
}
