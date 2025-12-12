"use client";

import { useState } from "react";
import ContractorEventsModal from "./ContractorEventsModal";
import VerifiedBadgeInline from "./VerifiedBadgeInline";

function getRoleIcon(role) {
  const roleLower = role?.toLowerCase() || "";
  const iconMap = {
    plumber: "🔧",
    electrician: "⚡",
    handyman: "🛠️",
    painter: "🎨",
    landscaper: "🌿",
    inspector: "🔍",
    appraiser: "📊",
    other: "📋",
  };
  return iconMap[roleLower] || "📋";
}

export default function MostActiveContractorBox({ contractor, events = [], buildingSlug }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const roles = contractor?.roles || [];
  const primaryRole = roles[0];
  const roleIcon = primaryRole ? getRoleIcon(primaryRole) : "📋";
  const isPaid = contractor?.subscription_tier === "paid";

  if (!contractor) {
    return (
      <div className="border rounded-md text-sm p-3 bg-gray-50">
        <div className="text-gray-500 text-center text-xs">
          No contractor activity recorded yet.
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="bg-white border-2 border-amber-200 rounded-lg text-sm p-4 hover:border-amber-300 hover:shadow-md cursor-pointer transition-all shadow-sm"
        onClick={() => setIsModalOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsModalOpen(true);
          }
        }}
      >
        <div className="text-center">
          <div className="font-medium flex items-center justify-center gap-2">
            {isPaid ? (
              <VerifiedBadgeInline />
            ) : (
              <span>{roleIcon}</span>
            )}
            <span>{contractor.name}</span>
          </div>
          <div className="text-gray-600 text-xs mt-1">
            {events.length} recent event{events.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      <ContractorEventsModal
        contractor={contractor}
        events={events}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        buildingSlug={buildingSlug}
      />
    </>
  );
}

