"use client";

import { useState } from "react";
import ContractorEventsModel from "./ContractorEventsModel";

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
          <div className="text-gray-600 text-xs">
            {events.length} recent event{events.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      <ContractorEventsModel
        contractor={contractor}
        events={events}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        buildingSlug={buildingSlug}
      />
    </>
  );
}

