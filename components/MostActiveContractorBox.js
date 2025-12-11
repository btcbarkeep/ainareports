"use client";

import { useState } from "react";
import ContractorEventsModal from "./ContractorEventsModal";

export default function MostActiveContractorBox({ contractor, events = [], buildingSlug }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

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
        className="border rounded-md text-sm p-3 bg-amber-50 hover:bg-amber-100 cursor-pointer transition-colors"
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
          <div className="font-medium">{contractor.name}</div>
          <div className="text-gray-600 text-xs mt-1">
            {events.length} recent event{events.length !== 1 ? "s" : ""}
          </div>
          {(contractor.phone || contractor.license_number) && (
            <div className="mt-2 pt-2 border-t border-amber-200 space-y-1">
              {contractor.phone && (
                <div className="text-xs text-gray-600">
                  📞 {contractor.phone}
                </div>
              )}
              {contractor.license_number && (
                <div className="text-xs text-gray-600">
                  🪪 License: {contractor.license_number}
                </div>
              )}
            </div>
          )}
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

