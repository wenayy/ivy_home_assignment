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

  if (error) return <div className="mx-auto max-w-375 px-4 py-8 sm:px-6 lg:px-11.5 lg:py-10.5"><Link className="mb-5 inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-forest" href="/listings"><ArrowLeft size={17} />Back to homes</Link><div className="flex min-h-85 flex-col items-center justify-center rounded-2xl border border-dashed border-[#cbd0ca] p-12 text-center text-ink-soft"><ShieldAlert size={28} /><h1 className="mt-3 font-serif text-2xl text-ink">Listing unavailable</h1><p>{error}</p></div></div>;
  if (!listing) return <div className="flex min-h-screen items-center justify-center gap-3 text-ink-soft"><span className="size-5 animate-spin rounded-full border-2 border-[#cbd3ce] border-t-forest" />Loading property details…</div>;

  const inactive = !listing.is_live;
  const sourceUrl = /^https?:\/\//i.test(listing.listing_url)
    ? listing.listing_url
    : `https://${listing.listing_url}`;
  return (
    <div className="mx-auto max-w-375 px-4 py-8 sm:px-6 lg:px-11.5 lg:py-10.5">
      <Link className="mb-5 inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-forest" href="/listings"><ArrowLeft size={17} />Back to homes</Link>
      <div className="grid min-h-85 overflow-hidden rounded-[20px] border border-line bg-paper shadow-[0_12px_40px_rgba(20,37,31,.05)] sm:grid-cols-[minmax(310px,.85fr)_1.15fr]">
        <div className="detail-pattern relative flex min-h-57.5 flex-col justify-end overflow-hidden bg-[#bcd1c7] p-6 after:absolute after:-top-35 after:-right-26 after:size-82.5 after:rounded-full after:border-48 after:border-white/25 sm:min-h-82.5"><span className="font-serif text-8xl leading-[.8] font-bold tracking-[-.1em] text-forest/65 sm:text-[7rem]">{listing.apartment_name.split(/\s+/).slice(0, 2).map((word) => word[0]).join("")}</span><small className="mt-4.5 font-bold text-forest capitalize">{listing.website}</small></div>
        <div className="flex flex-col items-start justify-center px-6 py-8 sm:p-[clamp(30px,5vw,70px)]">
          <div className="flex flex-wrap gap-2 [&>span]:flex [&>span]:items-center [&>span]:gap-1 [&>span]:rounded-md [&>span]:bg-mint [&>span]:px-2 [&>span]:py-1 [&>span]:text-[.7rem] [&>span]:font-bold [&>span]:text-forest-light"><span>{titleCase(listing.property_type)}</span>{listing.is_verified && <span><CheckCircle2 size={14} />Checked source</span>}{inactive && <span className="!bg-[#f3dfdb] !text-danger">Inactive</span>}</div>
          <h1 className="my-2 font-serif text-[clamp(2.1rem,4vw,3.35rem)] leading-none font-medium tracking-[-.045em]">{titleCase(listing.apartment_name)}</h1>
          <p className="m-0 flex items-center gap-1 text-ink-soft"><MapPin size={18} />{titleCase(listing.locality)}, Bangalore</p>
          <div className="my-5 flex flex-wrap items-baseline gap-3"><strong className="text-3xl">{formatInr(listing.price)}</strong><span className="text-sm text-ink-soft">{formatInr(listing.price / areas.carpet, { compact: false })} / sq ft</span></div>
          <SaveButton listingId={listing.listing_id} initialSaved={saved} />
        </div>
      </div>

      {inactive && <div className="mt-4 flex items-center gap-3 rounded-xl bg-[#f4e2de] px-4 py-3.5 text-[#81382f]"><ShieldAlert size={20} /><div className="flex flex-wrap gap-x-2 gap-y-1"><strong>This listing is no longer active.</strong><span className="text-sm">It remains reachable for reference, but it is excluded from the main search.</span></div></div>}
      {areas.converted && <div className="mt-4 flex items-center gap-3 rounded-xl bg-gold-pale px-4 py-3.5 text-[#614a20]"><Ruler size={20} /><div className="flex flex-wrap gap-x-2 gap-y-1"><strong>Area converted to square feet.</strong><span className="text-sm">The source supplied this record in square metres; the values below are normalized.</span></div></div>}

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[1fr_310px]">
        <section className="rounded-2xl border border-line bg-paper p-5 sm:p-7">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3 [&>div]:grid [&>div]:min-h-28 [&>div]:grid-cols-[24px_1fr] [&>div]:content-center [&>div]:gap-x-2 [&>div]:bg-paper [&>div]:p-4 [&_svg]:row-span-2 [&_svg]:w-5 [&_svg]:text-forest-light [&_span]:text-[.73rem] [&_span]:text-ink-soft [&_strong]:text-sm">
            <div><BedDouble /><span>Bedrooms</span><strong>{listing.bedroom || "Plot"}</strong></div>
            <div><Bath /><span>Bathrooms</span><strong>{listing.bathroom || "—"}</strong></div>
            <div><Ruler /><span>Carpet area</span><strong>{areas.carpet.toLocaleString("en-IN")} sq ft</strong></div>
            <div><Building /><span>Floor</span><strong>{listing.floor} of {listing.total_floors}</strong></div>
            <div><Car /><span>Covered parking</span><strong>{listing.covered_parking}</strong></div>
            <div><Compass /><span>Facing</span><strong>{titleCase(listing.facing_direction)}</strong></div>
          </div>
          <div className="pt-7.5"><p className="m-0 text-[.74rem] font-bold tracking-[.13em] text-forest-light uppercase">About this home</p><h2 className="mt-1 mb-3 font-serif text-2xl font-medium tracking-tight">Property notes</h2><p className="m-0 leading-7 text-ink-soft">{listing.description}</p></div>
          <div className="pt-7.5"><p className="m-0 text-[.74rem] font-bold tracking-[.13em] text-forest-light uppercase">Dimensions</p><h2 className="mt-1 mb-3 font-serif text-2xl font-medium tracking-tight">Area breakdown</h2><div className="grid gap-3 min-[420px]:grid-cols-2 [&>div]:rounded-[10px] [&>div]:bg-[#f4f5f0] [&>div]:p-4 [&_span]:block [&_span]:text-xs [&_span]:text-ink-soft [&_strong]:mt-1 [&_strong]:block"><div><span>Carpet area</span><strong>{areas.carpet.toLocaleString("en-IN")} sq ft</strong></div><div><span>Super built-up</span><strong>{areas.superArea.toLocaleString("en-IN")} sq ft</strong></div></div></div>
        </section>
        <aside className="rounded-2xl border border-line bg-paper p-6">
          <p className="m-0 text-[.74rem] font-bold tracking-[.13em] text-forest-light uppercase">Listing record</p>
          <dl className="my-4 [&>div]:border-b [&>div]:border-[#e7e8e2] [&>div]:py-3 [&_dt]:text-xs [&_dt]:text-ink-soft [&_dd]:mt-1 [&_dd]:flex [&_dd]:items-center [&_dd]:gap-1 [&_dd]:[overflow-wrap:anywhere] [&_dd]:text-sm [&_dd]:font-semibold"><div><dt>Furnishing</dt><dd>{titleCase(listing.furnishing)}</dd></div><div><dt>Posted by</dt><dd>{titleCase(listing.posted_by)}</dd></div><div><dt>Posted on</dt><dd><CalendarDays size={15} />{formatDate(listing.posted_at)}</dd></div><div><dt>Listing ID</dt><dd>{listing.listing_id}</dd></div></dl>
          <a href={sourceUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-[#cbd2cc] bg-paper px-4 font-bold text-forest hover:border-forest">View original source<ExternalLink size={16} /></a>
        </aside>
      </div>
    </div>
  );
}
