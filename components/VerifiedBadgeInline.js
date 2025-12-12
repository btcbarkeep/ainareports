"use client";

import { useState } from "react";

export default function VerifiedBadgeInline() {
  const [imageError, setImageError] = useState(false);
  
  if (imageError) {
    return null;
  }
  
  return (
    <img
      src="/verified-badge.png"
      alt="Verified"
      width={10}
      height={10}
      className="w-[10px] h-[10px] inline-block flex-shrink-0"
      onError={() => setImageError(true)}
    />
  );
}

