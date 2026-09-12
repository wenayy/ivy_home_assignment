"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ArrowUpRight, BarChart3, Building2, CircleCheck, CopyMinus, IndianRupee, Ruler, ShieldAlert } from "lucide-react";
import { apiJson } from "../../../lib/client-api";
import { formatInr, formatNumber, titleCase } from "../../../lib/format";

export default function InsightsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { apiJson("/api/insights").then(setData).catch((nextError) => setError(nextError.message)); }, []);

  if (error) return <div className="page-wrap"><div className="error-state"><AlertTriangle size={28} /><h1>Insights unavailable</h1><p>{error}</p></div></div>;
  if (!data) return <div className="detail-loading"><span className="spinner" />Calculating across every retrievable record…</div>;
  const maxLocality = Math.max(...data.by_locality.map((item) => item.count));
  const maxBhk = Math.max(...data.by_bhk.map((item) => item.count));

  return (
    <div className="page-wrap insights-page">
      <header className="page-header"><div><p className="eyebrow">Market pulse</p><h1>Bangalore insights</h1><p>Trusted active inventory powers market figures; the audit trail stays visible beside it. Fixed analytical reference: 10 Sep 2026 IST.</p></div><a className="approach-link" href="https://app.notion.com/p/Ivy-home-assignment-Vinay-Joshi-3d8e8c1de17f80e98737dbedc03f8df2" target="_blank" rel="noreferrer">See my approach<ArrowUpRight size={17} /></a></header>
      <section className="metric-grid">
        <div><span className="metric-icon"><Building2 /></span><p>Retrievable records</p><strong>{formatNumber(data.total_listings)}</strong><small>{formatNumber(data.unique_properties)} distinct properties</small></div>
        <div><span className="metric-icon"><CircleCheck /></span><p>Trusted active homes</p><strong>{formatNumber(data.trusted_active_listings)}</strong><small>after quality screening</small></div>
        <div><span className="metric-icon"><IndianRupee /></span><p>Median sale price</p><strong>{formatInr(data.median_price)}</strong><small>trusted active inventory</small></div>
        <div><span className="metric-icon"><Ruler /></span><p>Median price / sq ft</p><strong>{formatInr(data.median_price_per_sqft, { compact: false })}</strong><small>normalized carpet area</small></div>
      </section>
      <div className="insight-layout">
        <section className="chart-panel"><div className="section-heading"><div><p className="eyebrow">Supply</p><h2>Homes by locality</h2></div><BarChart3 size={21} /></div><div className="bar-list">{data.by_locality.map((item) => <div className="bar-row" key={item.locality}><span>{titleCase(item.locality)}</span><div><i style={{ width: `${item.count / maxLocality * 100}%` }} /></div><strong>{formatNumber(item.count)}</strong><small>{formatInr(item.median_price)} median</small></div>)}</div></section>
        <section className="chart-panel compact-chart"><div className="section-heading"><div><p className="eyebrow">Configuration</p><h2>Homes by BHK</h2></div></div><div className="bhk-chart">{data.by_bhk.map((item) => <div key={item.bedroom}><strong>{formatNumber(item.count)}</strong><span style={{ height: `${Math.max(8, item.count / maxBhk * 150)}px` }} /><small>{item.bedroom === 0 ? "Plots" : `${item.bedroom} BHK`}</small></div>)}</div></section>
      </div>
      <section className="audit-panel"><div className="section-heading"><div><p className="eyebrow">What the source gets wrong</p><h2>Corrections applied in this app</h2></div><ShieldAlert size={23} /></div><div className="audit-grid">
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
