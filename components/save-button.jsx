"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { apiJson } from "../lib/client-api";

export default function SaveButton({ listingId, initialSaved = false, onChange, compact = false }) {
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function toggle(event) {
    event?.preventDefault();
    event?.stopPropagation();
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      if (saved) {
        await apiJson(`/api/ivy/v1/saved/${encodeURIComponent(listingId)}`, { method: "DELETE" });
      } else {
        await apiJson("/api/ivy/v1/saved", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listing_id: listingId }),
        });
      }
      setSaved(!saved);
      onChange?.(!saved);
    } catch (error) {
      if (!saved && /already|saved/i.test(error.message)) setSaved(true);
      else setMessage(error.message);
    } finally { setBusy(false); }
  }

  return (
    <span className="inline-flex flex-col items-start">
      <button
        className={compact
          ? `absolute top-3 right-3 z-2 grid size-9 place-items-center rounded-full border-0 shadow-[0_5px_16px_rgba(20,37,31,.12)] ${saved ? "bg-forest text-white" : "bg-white/90 text-forest"}`
          : `flex min-h-10.5 items-center gap-2 rounded-[9px] border px-4 font-bold ${saved ? "border-forest bg-forest text-white" : "border-[#c7cec8] bg-white text-forest"}`}
        onClick={toggle}
        disabled={busy}
        aria-pressed={saved}
        aria-label={saved ? "Remove from saved" : "Save listing"}
        title={message || (saved ? "Remove from saved" : "Save listing")}
      >
        <Heart size={compact ? 18 : 19} fill={saved ? "currentColor" : "none"} />
        {!compact && (saved ? "Saved" : "Save")}
      </button>
      {message && !compact && <small className="mt-1 text-danger">{message}</small>}
    </span>
  );
}
