import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabaseClient";

export async function GET(req) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ buildings: [], units: [] });
    }

    // ---------------------------------------------------------
    // BUILDINGS
    // ---------------------------------------------------------
    // Separate building name words (non-numeric) from unit numbers (numeric)
    const queryWords = q.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    const buildingNameWords = queryWords.filter(word => !/\d/.test(word));
    const unitNumberWords = queryWords.filter(word => /\d/.test(word));
    const hasUnitNumber = unitNumberWords.length > 0;
    const hasBuildingName = buildingNameWords.length > 0;
    
    let buildingQuery = supabase
      .from("buildings")
      .select("id, name, address, city, state, zip, slug");
    
    // Build search conditions
    let buildingConditions = [];
    if (hasBuildingName && hasUnitNumber) {
      // When we have BOTH building name AND unit number:
      // Only match buildings on building name words (ignore numbers in addresses/zip)
      buildingNameWords.forEach(word => {
        buildingConditions.push(`name.ilike.%${word}%`);
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
    
    const { data: buildings, error: buildingsError } = await buildingQuery
      .or(buildingConditions.join(","))
      .limit(10);

    if (buildingsError) {
      console.error("Error fetching buildings:", buildingsError);
      return NextResponse.json(
        { error: "Failed to fetch buildings" },
        { status: 500 }
      );
    }

    let units = [];
    
    // Get matched building IDs to filter out units from other buildings
    const matchedBuildingIds = buildings?.length > 0 
      ? new Set(buildings.map((b) => b.id))
      : new Set();
    
    // ---------------------------------------------------------
    // 1) GET UNITS BY BUILDING MATCH (filter by unit number if present)
    // ---------------------------------------------------------
    if (buildings?.length) {
      const buildingIds = Array.from(matchedBuildingIds);

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

    // ---------------------------------------------------------
    // 2) GET UNITS DIRECTLY MATCHING TEXT
    // If we have building matches, only include units from those buildings
    // ---------------------------------------------------------
    let unitsByTextQuery = supabase
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
      `);
    
    // If we have building matches, filter to only those buildings
    if (matchedBuildingIds.size > 0) {
      unitsByTextQuery = unitsByTextQuery.in("building_id", Array.from(matchedBuildingIds));
    }
    
    // Build search conditions
    const searchConditions = [];
    if (hasUnitNumber) {
      // If we have unit numbers, prioritize those
      const unitNumberConditions = unitNumberWords.map(word => `unit_number.ilike.%${word}%`);
      searchConditions.push(...unitNumberConditions);
    } else {
      // Otherwise search by unit number or building fields
      searchConditions.push(`unit_number.ilike.%${q}%`);
    }
    
    // Only add building text conditions if we don't have building matches
    if (matchedBuildingIds.size === 0) {
      searchConditions.push(
        `building.name.ilike.%${q}%`,
        `building.address.ilike.%${q}%`,
        `building.city.ilike.%${q}%`,
        `building.state.ilike.%${q}%`
      );
    }
    
    const { data: unitsByText, error: unitsByTextError } = await unitsByTextQuery
      .or(searchConditions.join(","));

    if (unitsByTextError) {
      console.error("Error fetching units by text:", unitsByTextError);
    } else if (unitsByText) {
      units.push(...unitsByText);
    }

    // ---------------------------------------------------------
    // 3) REMOVE DUPLICATES
    // ---------------------------------------------------------
    const uniqueUnits = Object.values(
      units.reduce((acc, u) => {
        acc[u.id] = u;
        return acc;
      }, {})
    );

    return NextResponse.json({
      buildings: buildings || [],
      units: uniqueUnits
    });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
