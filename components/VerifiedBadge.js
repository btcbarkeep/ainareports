"use client";

import { useState } from "react";

export default function VerifiedBadge({ type = "building" }) {
  const label = type === "building" ? "Aina Verified Building" : "Aina Verified Unit";
  const [imageError, setImageError] = useState(false);
  
  if (imageError) {
    return null; // Don't show anything if image fails to load
  }
  
  return (
    <div className="flex items-center" title={label}>
      <img
        src="/verified-badge.png"
        alt={label}
        width={32}
        height={32}
        className="w-8 h-8"
        onError={() => setImageError(true)}
      />
    </div>
  );
}

