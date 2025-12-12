"use client";

import { useState, useEffect } from "react";

export default function SearchBar({ initialQuery = "" }) {
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState([]);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL;

  // Hide suggestions if there's an initial query (search was submitted)
  const showSuggestions = suggestions.length > 0 && !initialQuery;

  useEffect(() => {
    // Don't fetch suggestions if there's an initial query (search was submitted)
    if (initialQuery) {
      setSuggestions([]);
      return;
    }

    if (!query || query.trim().length < 1) {
      setSuggestions([]);
      return;
    }

    if (!apiUrl) {
      console.warn("API URL not configured");
      return;
    }

    const timer = setTimeout(async () => {
      try {
        // Call the public search API endpoint
        const response = await fetch(
          `${apiUrl}/reports/public/search?query=${encodeURIComponent(query)}`,
          {
            headers: {
              "accept": "application/json",
            },
          }
        );

        if (!response.ok) {
          console.error("Error fetching search suggestions:", response.status);
          setSuggestions([]);
          return;
        }

        const data = await response.json();
        const buildings = data.buildings || [];

        // Only show buildings in autocomplete, not units
        // (Units will still appear in the search results page after submission)
        const buildingMatches = buildings.slice(0, 5).map((b) => ({
          type: "building",
          label: `${b.name} — ${b.address || ""}`,
          slug: b.slug,
        }));

        setSuggestions(buildingMatches);
      } catch (error) {
        console.error("Search error:", error);
        setSuggestions([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, apiUrl, initialQuery]);

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

      {showSuggestions && (
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
