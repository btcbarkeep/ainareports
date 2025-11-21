"use client";

import { useState } from "react";

export default function UnitsList({ units }) {
  const [expanded, setExpanded] = useState(false);

  // Normalize units so we always use `u.building`
  const cleaned = units.filter((u) => u.building);

  const top3 = cleaned.slice(0, 3);
  const showUnits = expanded ? cleaned : top3;

  if (cleaned.length === 0) {
    return <p className="text-gray-500">No units found.</p>;
  }

  return (
    <div className="mt-6">
      {showUnits.map((u) => (
        <a
          key={u.id}
          href={`/${u.building.slug}/${u.unit_number}`}
          className="block border rounded-md px-4 py-3 mb-3 hover:bg-gray-50"
        >
          <div className="text-base font-medium">
            Unit {u.unit_number} — {u.building.name}
          </div>

          <div className="text-sm text-gray-600">
            {u.building.address}, {u.building.city}, {u.building.state}{" "}
            {u.building.zip}
          </div>
        </a>
      ))}

      {!expanded && cleaned.length > 3 && (
        <button
          onClick={() => setExpanded(true)}
          className="text-blue-600 underline font-medium mt-2"
        >
          See more units ↓
        </button>
      )}

      {expanded && cleaned.length > 3 && (
        <button
          onClick={() => setExpanded(false)}
          className="text-blue-600 underline font-medium mt-2"
        >
          See fewer units ↑
        </button>
      )}
    </div>
  );
}
