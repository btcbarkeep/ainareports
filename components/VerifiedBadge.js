import Image from "next/image";

export default function VerifiedBadge({ type = "building" }) {
  const label = type === "building" ? "Aina Verified Building" : "Aina Verified Unit";
  
  return (
    <div className="inline-flex items-center ml-2" title={label}>
      <Image
        src="/verified-badge.png"
        alt={label}
        width={40}
        height={40}
        className="w-10 h-10"
      />
    </div>
  );
}

