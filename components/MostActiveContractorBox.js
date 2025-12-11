"use client";

import { useState } from "react";
import ContractorEventsModal from "./ContractorEventsModal";

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
        className="border rounded-md text-sm p-3 bg-blue-50 hover:bg-blue-100 cursor-pointer transition-colors border-blue-200"
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
            <span>{roleIcon}</span>
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

