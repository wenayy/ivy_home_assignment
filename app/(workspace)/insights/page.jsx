"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ArrowUpRight, BarChart3, Building2, CircleCheck, CopyMinus, IndianRupee, Ruler, ShieldAlert } from "lucide-react";
import { apiJson } from "../../../lib/client-api";
import { formatInr, formatNumber, titleCase } from "../../../lib/format";

export default function InsightsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { apiJson("/api/insights").then(setData).catch((nextError) => setError(nextError.message)); }, []);

  if (error) return <div className="mx-auto max-w-375 px-4 py-8 sm:px-6 lg:px-11.5 lg:py-10.5"><div className="flex min-h-85 flex-col items-center justify-center rounded-2xl border border-dashed border-[#cbd0ca] p-12 text-center text-ink-soft"><AlertTriangle size={28} /><h1 className="mt-3 font-serif text-2xl text-ink">Insights unavailable</h1><p>{error}</p></div></div>;
  if (!data) return <div className="flex min-h-screen items-center justify-center gap-3 text-ink-soft"><span className="size-5 animate-spin rounded-full border-2 border-[#cbd3ce] border-t-forest" />Calculating across every retrievable record…</div>;
  const maxLocality = Math.max(...data.by_locality.map((item) => item.count));
  const maxBhk = Math.max(...data.by_bhk.map((item) => item.count));

  return (
    <div className="mx-auto max-w-375 px-4 py-8 sm:px-6 lg:px-11.5 lg:py-10.5">
      <header className="mb-7 flex items-start justify-between gap-3 sm:items-end sm:gap-8"><div><p className="m-0 text-[.74rem] font-bold tracking-[.13em] text-forest-light uppercase">Market pulse</p><h1 className="my-1.5 font-serif text-[clamp(2.1rem,4vw,3.35rem)] leading-none font-medium tracking-[-.045em]">Bangalore insights</h1><p className="m-0 max-w-170 text-sm text-ink-soft sm:text-base">Trusted active inventory powers market figures; the audit trail stays visible beside it. Fixed analytical reference: 10 Sep 2026 IST.</p></div><a className="inline-flex min-h-10.5 shrink-0 items-center gap-2 rounded-xl border border-[#bd8b30] bg-gold px-3 text-[.8rem] font-bold text-forest shadow-[0_8px_22px_rgba(123,87,24,.17)] transition hover:-translate-y-0.5 hover:bg-[#dfb45f] sm:min-h-11.5 sm:px-4 sm:text-[.86rem]" href="https://app.notion.com/p/Ivy-home-assignment-Vinay-Joshi-3d8e8c1de17f80e98737dbedc03f8df2" target="_blank" rel="noreferrer">See my approach<ArrowUpRight size={17} /></a></header>
      <section className="grid grid-cols-1 gap-3.5 min-[420px]:grid-cols-2 xl:grid-cols-4 [&>div]:relative [&>div]:min-h-41.5 [&>div]:rounded-2xl [&>div]:border [&>div]:border-line [&>div]:bg-paper [&>div]:p-5 [&_p]:mt-4 [&_p]:mb-0 [&_p]:text-xs [&_p]:text-ink-soft [&_strong]:block [&_strong]:font-serif [&_strong]:text-[1.75rem] [&_strong]:font-medium [&_strong]:tracking-tight [&_small]:text-[.7rem] [&_small]:text-[#77847d]">
        <div><span className="grid size-8.5 place-items-center rounded-[9px] bg-mint text-forest-light [&_svg]:w-4.5"><Building2 /></span><p>Retrievable records</p><strong>{formatNumber(data.total_listings)}</strong><small>{formatNumber(data.unique_properties)} distinct properties</small></div>
        <div><span className="grid size-8.5 place-items-center rounded-[9px] bg-mint text-forest-light [&_svg]:w-4.5"><CircleCheck /></span><p>Trusted active homes</p><strong>{formatNumber(data.trusted_active_listings)}</strong><small>after quality screening</small></div>
        <div><span className="grid size-8.5 place-items-center rounded-[9px] bg-mint text-forest-light [&_svg]:w-4.5"><IndianRupee /></span><p>Median sale price</p><strong>{formatInr(data.median_price)}</strong><small>trusted active inventory</small></div>
        <div><span className="grid size-8.5 place-items-center rounded-[9px] bg-mint text-forest-light [&_svg]:w-4.5"><Ruler /></span><p>Median price / sq ft</p><strong>{formatInr(data.median_price_per_sqft, { compact: false })}</strong><small>normalized carpet area</small></div>
      </section>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_.6fr]">
        <section className="rounded-2xl border border-line bg-paper p-6"><div className="flex items-start justify-between gap-5"><div><p className="m-0 text-[.74rem] font-bold tracking-[.13em] text-forest-light uppercase">Supply</p><h2 className="mt-1 mb-3 font-serif text-2xl font-medium tracking-tight">Homes by locality</h2></div><BarChart3 size={21} /></div><div className="mt-5 grid gap-2.5">{data.by_locality.map((item) => <div className="grid grid-cols-[92px_1fr_34px] items-center gap-2 text-[.73rem] sm:grid-cols-[112px_1fr_38px_84px]" key={item.locality}><span className="font-semibold">{titleCase(item.locality)}</span><div className="h-2 overflow-hidden rounded-xl bg-[#e9ece7]"><i className="block h-full rounded-[inherit] bg-forest-light" style={{ width: `${item.count / maxLocality * 100}%` }} /></div><strong>{formatNumber(item.count)}</strong><small className="hidden text-right text-ink-soft sm:block">{formatInr(item.median_price)} median</small></div>)}</div></section>
        <section className="rounded-2xl border border-line bg-paper p-6"><div><p className="m-0 text-[.74rem] font-bold tracking-[.13em] text-forest-light uppercase">Configuration</p><h2 className="mt-1 mb-3 font-serif text-2xl font-medium tracking-tight">Homes by BHK</h2></div><div className="flex min-h-61 items-end justify-center gap-3 pt-6">{data.by_bhk.map((item) => <div className="flex min-w-8.5 flex-col items-center" key={item.bedroom}><strong className="text-[.66rem] text-ink-soft">{formatNumber(item.count)}</strong><span className="my-1 block w-6 rounded-t-md rounded-b-sm bg-gold" style={{ height: `${Math.max(8, item.count / maxBhk * 150)}px` }} /><small className="text-[.62rem] whitespace-nowrap">{item.bedroom === 0 ? "Plots" : `${item.bedroom} BHK`}</small></div>)}</div></section>
      </div>
      <section className="mt-4 rounded-2xl border border-forest bg-forest p-6 text-white"><div className="flex items-start justify-between gap-5"><div><p className="m-0 text-[.74rem] font-bold tracking-[.13em] text-[#e4bb70] uppercase">What the source gets wrong</p><h2 className="mt-1 mb-3 font-serif text-2xl font-medium tracking-tight">Corrections applied in this app</h2></div><ShieldAlert size={23} /></div><div className="mt-4.5 grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-2 lg:grid-cols-3 [&>div]:grid [&>div]:min-h-29.5 [&>div]:grid-cols-[26px_1fr] [&>div]:rounded-xl [&>div]:border [&>div]:border-white/10 [&>div]:bg-white/8 [&>div]:p-4 [&_svg]:w-5 [&_svg]:text-[#edc579] [&_strong]:font-serif [&_strong]:text-2xl [&_strong]:font-medium [&_span]:col-start-2 [&_span]:text-xs [&_span]:text-[#c9d5cf]">
        <div><CopyMinus /><strong>{formatNumber(data.discoveries.hidden_listing_records)}</strong><span>duplicate records past the advertised total</span></div>
        <div><AlertTriangle /><strong>{formatNumber(data.discoveries.impossible_records)}</strong><span>physically or temporally impossible listings</span></div>
        <div><ShieldAlert /><strong>{formatNumber(data.discoveries.suspicious_records)}</strong><span>coordinated lead-generation listings screened out</span></div>
        <div><Ruler /><strong>{formatNumber(data.discoveries.converted_area_records)}</strong><span>sale areas converted from m² to sq ft</span></div>
        <div><IndianRupee /><strong>{formatNumber(data.discoveries.converted_deposit_records)}</strong><span>rental deposits converted from months to INR</span></div>
        <div><Building2 /><strong>{formatNumber(data.discoveries.wrong_project_counts)}</strong><span>projects with incorrect availability counts</span></div>
      </div></section>
    </div>
  );
}
