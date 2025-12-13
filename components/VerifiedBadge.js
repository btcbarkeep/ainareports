"use client";

import { useState } from "react";
import VerifiedBadgeInline from "./VerifiedBadgeInline";

export default function VerifiedBadge({ type = "building" }) {
  const label = type === "building" ? "Aina Verified Building" : "Aina Verified Unit";
  const tooltipText = type === "building" 
    ? "Aina Verified Building — Verified by Aina Protocol"
    : "Premium Unit Owner — Verified by Aina Protocol";
  const [imageError, setImageError] = useState(false);
  
  if (imageError) {
    return null; // Don't show anything if image fails to load
  }
  
  return (
    <div className="relative group">
      <div className="flex items-center">
      <img
        src="/verified-badge.png"
        alt={label}
        width={24}
        height={24}
        className="w-6 h-6"
        onError={() => setImageError(true)}
      />
      </div>
      {/* Hover tooltip */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10 border border-gray-200">
        <div className="flex items-center gap-1.5">
          <VerifiedBadgeInline />
          <span>{tooltipText}</span>
        </div>
      </div>
    </div>
  );
}

