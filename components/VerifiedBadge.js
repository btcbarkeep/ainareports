"use client";

import Image from "next/image";
import { useState } from "react";

export default function VerifiedBadge({ type = "building" }) {
  const label = type === "building" ? "Aina Verified Building" : "Aina Verified Unit";
  const [imageError, setImageError] = useState(false);
  
  return (
    <div className="flex items-center" title={label}>
      {!imageError ? (
        <Image
          src="/verified-badge.png"
          alt={label}
          width={32}
          height={32}
          className="w-8 h-8"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center">
          <span className="text-white text-xs font-bold">✓</span>
        </div>
      )}
    </div>
  );
}

