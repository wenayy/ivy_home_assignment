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
    <span className="save-wrap">
      <button
        className={`${compact ? "save-icon" : "save-button"} ${saved ? "saved" : ""}`}
        onClick={toggle}
        disabled={busy}
        aria-pressed={saved}
        aria-label={saved ? "Remove from saved" : "Save listing"}
        title={message || (saved ? "Remove from saved" : "Save listing")}
      >
        <Heart size={compact ? 18 : 19} fill={saved ? "currentColor" : "none"} />
        {!compact && (saved ? "Saved" : "Save")}
      </button>
      {message && !compact && <small className="save-error">{message}</small>}
    </span>
  );
}

