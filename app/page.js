import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabaseClient";
import SearchBar from "@/components/SearchBar";

export default async function Home({ searchParams }) {
  const query = (searchParams?.q || "").trim();
  const supabase = getSupabaseClient();

  let buildingResults = [];
  let unitResults = [];

  if (query) {
    try {
      // Split query into words for better matching
      const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 0);
      
      // Separate building name words (non-numeric) from unit numbers (numeric)
      const buildingNameWords = queryWords.filter(word => !/\d/.test(word));
      const unitNumberWords = queryWords.filter(word => /\d/.test(word));
      const hasUnitNumber = unitNumberWords.length > 0;
      const hasBuildingName = buildingNameWords.length > 0;
      
      // ⭐ BUILDINGS - Search for any word matching
      // If we have building name words, prioritize those (don't match numbers in addresses)
      let buildingQuery = supabase
        .from("buildings")
        .select("id, name, address, city, state, zip, slug");
      
      // Build OR conditions for each word
      const buildingConditions = [];
      if (hasBuildingName && hasUnitNumber) {
        // When we have BOTH building name AND unit number:
        // Only match buildings on building name words (ignore numbers in addresses/zip)
        // The numeric part is exclusively for unit number matching
        buildingNameWords.forEach(word => {
          buildingConditions.push(`name.ilike.%${word}%`);
          // Only match addresses/cities/states on non-numeric words
          buildingConditions.push(`address.ilike.%${word}%`);
          buildingConditions.push(`city.ilike.%${word}%`);
          buildingConditions.push(`state.ilike.%${word}%`);
        });
      } else if (hasBuildingName) {
        // Only building name words, no unit numbers - match on all fields
        buildingNameWords.forEach(word => {
          buildingConditions.push(`name.ilike.%${word}%`);
          buildingConditions.push(`address.ilike.%${word}%`);
          buildingConditions.push(`city.ilike.%${word}%`);
          buildingConditions.push(`state.ilike.%${word}%`);
          buildingConditions.push(`zip.ilike.%${word}%`);
        });
      } else {
        // No building name words, match all words (including numbers)
        queryWords.forEach(word => {
          buildingConditions.push(`name.ilike.%${word}%`);
          buildingConditions.push(`address.ilike.%${word}%`);
          buildingConditions.push(`city.ilike.%${word}%`);
          buildingConditions.push(`state.ilike.%${word}%`);
          buildingConditions.push(`zip.ilike.%${word}%`);
        });
      }
      
      const { data: bData, error: bError } = await buildingQuery
        .or(buildingConditions.join(","))
        .limit(10);

      if (bError) {
        console.error("Error fetching buildings:", bError);
      } else {
        buildingResults = bData || [];
      }

      // ⭐ UNITS - Fetch in two ways:
      // 1) Units belonging to matching buildings (but filter by unit number if present)
      let units = [];
      
      if (buildingResults.length > 0) {
        const buildingIds = buildingResults.map((b) => b.id);
        let unitsByBuildingQuery = supabase
          .from("units")
          .select(`
            id,
            unit_number,
            building_id,
            building:building_id (
              id,
              name,
              slug,
              address,
              city,
              state,
              zip
            )
          `)
          .in("building_id", buildingIds);
        
        // If we have a unit number in the query, filter by it
        if (hasUnitNumber) {
          // Build OR conditions for unit numbers
          const unitNumberConditions = unitNumberWords.map(word => `unit_number.ilike.%${word}%`);
          unitsByBuildingQuery = unitsByBuildingQuery.or(unitNumberConditions.join(","));
        }

        const { data: unitsByBuilding, error: unitsByBuildingError } = await unitsByBuildingQuery;

        if (unitsByBuildingError) {
          console.error("Error fetching units by building:", unitsByBuildingError);
        } else if (unitsByBuilding) {
          units.push(...unitsByBuilding);
        }
      }

      // Get matched building IDs to filter out units from other buildings
      const matchedBuildingIds = buildingResults.length > 0 
        ? new Set(buildingResults.map((b) => b.id))
        : new Set();

      // 2) Units matching by unit_number (direct search) - only if no building matches
      // OR if we have building matches, only include units from those buildings
      let unitsByNumber = [];
      if (hasUnitNumber) {
        for (const word of unitNumberWords) {
          let unitsByNumberQuery = supabase
            .from("units")
            .select(`
              id,
              unit_number,
              building_id,
              building:building_id (
                id,
                name,
                slug,
                address,
                city,
                state,
                zip
              )
            `)
            .ilike("unit_number", `%${word}%`);
          
          // If we have building matches, only get units from those buildings
          if (matchedBuildingIds.size > 0) {
            unitsByNumberQuery = unitsByNumberQuery.in("building_id", Array.from(matchedBuildingIds));
          }
          
          const { data: data, error: error } = await unitsByNumberQuery;
          
          if (!error && data) {
            unitsByNumber.push(...data);
          }
        }
      }

      if (unitsByNumber.length > 0) {
        units.push(...unitsByNumber);
      }

      // 3) Units matching by building name/address (via join) - only if no building matches yet
      // This helps find buildings that weren't found in the initial building search
      if (buildingResults.length === 0) {
        const buildingTextConditions = [];
        queryWords.forEach(word => {
          buildingTextConditions.push(`building.name.ilike.%${word}%`);
          buildingTextConditions.push(`building.address.ilike.%${word}%`);
          buildingTextConditions.push(`building.city.ilike.%${word}%`);
          buildingTextConditions.push(`building.state.ilike.%${word}%`);
        });
        
        const { data: unitsByBuildingText, error: unitsByBuildingTextError } = await supabase
          .from("units")
          .select(`
            id,
            unit_number,
            building_id,
            building:building_id (
              id,
              name,
              slug,
              address,
              city,
              state,
              zip
            )
          `)
          .or(buildingTextConditions.join(","));

        if (unitsByBuildingTextError) {
          console.error("Error fetching units by building text:", unitsByBuildingTextError);
        } else if (unitsByBuildingText) {
          units.push(...unitsByBuildingText);
        }
      }

      // Remove duplicates
      const uniqueUnits = Object.values(
        units.reduce((acc, u) => {
          acc[u.id] = u;
          return acc;
        }, {})
      );

      unitResults = uniqueUnits;
    } catch (error) {
      console.error("Search error:", error);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center pt-20 px-4">
      {/* LOGO + TITLE */}
      <div className="flex flex-col items-center mb-8 w-full max-w-2xl">
        <Link href="/" className="cursor-pointer mb-4">
          <img
            src="/aina-logo-dark.png"
            alt="Aina Logo"
            width={60}
            height={60}
            className="w-16 h-16 object-contain mx-auto"
          />
        </Link>

        <div className="text-xs tracking-[0.25em] uppercase mb-6 text-center">
          AINAREPORTS
        </div>

        <h1 className="text-3xl md:text-4xl font-semibold text-center mb-2">
          Reliable Condo Reports for Hawaii
        </h1>

        <p className="text-sm md:text-base text-gray-600 mb-6 text-center">
          Powered by{" "}
          <a
            href="https://ainaprotocol.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-900 underline"
          >
            Aina Protocol
          </a>
        </p>

        {/* SEARCH BAR */}
        <div className="w-full flex justify-center mb-4">
          <SearchBar initialQuery={query} />
        </div>

        <div className="flex gap-6 text-sm text-gray-700 mt-4 justify-center">
          <span>Building Reports</span>
          <span>Unit Reports</span>
          <span>AOAO Documents</span>
        </div>
      </div>

      {/* RESULTS BELOW SEARCH BAR */}
      {query && (
        <section className="w-full max-w-3xl mt-4 mb-16">
          <p className="text-xs uppercase tracking-wide text-gray-500 mb-3">
            Search results for:{" "}
            <span className="font-semibold">"{query}"</span>
          </p>

          <div className="space-y-6 text-sm">
            {/* BUILDINGS */}
            <div>
              <h2 className="font-semibold mb-2">Buildings</h2>

              {buildingResults.length === 0 ? (
                <p className="text-gray-500">No buildings found.</p>
              ) : (
                <ul className="border border-gray-200 rounded-md divide-y">
                  {buildingResults.map((b) => (
                    <li
                      key={b.id}
                      className="px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-1"
                    >
                      <div>
                        <div className="font-medium">{b.name}</div>
                        <div className="text-gray-500">
                          {[b.address, b.city, b.state, b.zip]
                            .filter(Boolean)
                            .join(", ")}
                        </div>
                      </div>

                      <Link
                        href={`/${b.slug}`}
                        className="text-xs md:text-sm underline underline-offset-2"
                      >
                        View Building Report
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* UNITS */}
            <div>
              <h2 className="font-semibold mb-2">Units</h2>

              {unitResults.length === 0 ? (
                <p className="text-gray-500">No units found.</p>
              ) : (
                <ul className="border border-gray-200 rounded-md divide-y">
                  {unitResults.map((u) => (
                    <li
                      key={u.id}
                      className="px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-1"
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

                      <Link
                        href={`/${u.building?.slug}/${u.unit_number}`}
                        className="text-xs md:text-sm underline underline-offset-2"
                      >
                        View Unit Report
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
