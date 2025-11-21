"use client";

import { useState, useEffect, useMemo } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function SearchBar({ initialQuery = "" }) {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (!query || query.trim().length < 1) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        // BUILDINGS
        const { data: buildingMatches, error: buildingError } = await supabase
          .from("buildings")
          .select("id, name, address, city, state, slug")
          .or(`name.ilike.%${query}%,address.ilike.%${query}%`)
          .limit(5);

        if (buildingError) {
          console.error("Error fetching buildings:", buildingError);
        }

        // UNITS
        const { data: unitMatchesRaw, error: unitError } = await supabase
          .from("units")
          .select(`
            id,
            unit_number,
            building:building_id (
              name,
              slug,
              address
            )
          `)
          .or(
            [
              `unit_number.ilike.%${query}%`,
              `building.name.ilike.%${query}%`
            ].join(",")
          )
          .limit(5);

        if (unitError) {
          console.error("Error fetching units:", unitError);
        }

        const unitMatches = (unitMatchesRaw || []).map((u) => ({
          type: "unit",
          label: `Unit ${u.unit_number} — ${u.building?.name || ""}`,
          slug: u.building?.slug,
          unit: u.unit_number
        }));

        const combined = [
          ...(buildingMatches || []).map((b) => ({
            type: "building",
            label: `${b.name} — ${b.address}`,
            slug: b.slug
          })),
          ...unitMatches
        ];

        setSuggestions(combined);
      } catch (error) {
        console.error("Search error:", error);
        setSuggestions([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, supabase]);

  return (
    <div className="relative w-full max-w-xl">
      <form method="GET">
        <div className="flex items-stretch border border-gray-300 rounded-md overflow-hidden">
          <input
            type="text"
            name="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search address, building, or unit number"
            className="flex-1 px-4 py-3 text-sm md:text-base outline-none"
            autoComplete="off"
          />
          <button
            type="submit"
            className="px-4 md:px-5 border-l border-gray-300 flex items-center justify-center"
          >
            🔍
          </button>
        </div>
      </form>

      {suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 bg-white border border-gray-200 rounded-md shadow-md mt-1 z-50">
          {suggestions.map((s, i) => (
            <li
              key={i}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
              onMouseDown={() => {
                if (s.type === "building") window.location.href = `/${s.slug}`;
                else window.location.href = `/${s.slug}/${s.unit}`;
              }}
            >
              {s.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
