"use client";

import Image from "next/image";
import { useState } from "react";

export default function VerifiedBadge({ type = "building" }) {
  const label = type === "building" ? "Aina Verified Building" : "Aina Verified Unit";
  const [imageError, setImageError] = useState(false);
  
  // Always show fallback for now since image might not exist
  // If image exists, it will load and replace the fallback
  return (
    <div className="flex items-center" title={label}>
      {imageError ? (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-md">
          <span className="text-white text-sm font-bold">✓</span>
        </div>
      ) : (
        <div className="relative w-8 h-8">
          <div className="absolute inset-0 w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-md">
            <span className="text-white text-sm font-bold">✓</span>
          </div>
          <Image
            src="/verified-badge.png"
            alt={label}
            width={32}
            height={32}
            className="w-8 h-8"
            onError={() => setImageError(true)}
            style={{ display: imageError ? 'none' : 'block' }}
          />
        </div>
      )}
    </div>
  );
}

