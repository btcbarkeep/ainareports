import Image from "next/image";

export default function VerifiedBadge({ type = "building" }) {
  const label = type === "building" ? "Aina Verified Building" : "Aina Verified Unit";
  
  return (
    <div className="flex items-center" title={label}>
      <Image
        src="/verified-badge.png"
        alt={label}
        width={32}
        height={32}
        className="w-8 h-8"
      />
    </div>
  );
}

