"use client";

import { useState } from "react";
import Link from "next/link";

export default function UnitsList({ units }) {
  const [showAll, setShowAll] = useState(false);
  const maxInitial = 5;
  const hasMore = units.length > maxInitial;
  const displayedUnits = showAll ? units : units.slice(0, maxInitial);

  if (units.length === 0) {
    return <p className="text-gray-500">No units found.</p>;
  }

  return (
    <>
      <ul className="border border-gray-200 rounded-md divide-y">
        {displayedUnits.map((u) => (
          <li key={u.id}>
            <Link
              href={`/${u.building?.slug}/${u.unit_number}`}
              className="block px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-1 hover:bg-gray-50 transition-colors"
            >
              <div>
                <div className="font-medium">
                  Unit {u.unit_number}
                  {u.building?.name ? ` — ${u.building.name}` : ""}
                </div>

                {u.building && (
                  <div className="text-gray-500">
                    {[u.building.address, u.building.city, u.building.state, u.building.zip]
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                )}
              </div>

              <div className="text-xs md:text-sm text-blue-600 underline underline-offset-2">
                View Unit Report
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
        >
          View more
        </button>
      )}
    </>
  );
}

