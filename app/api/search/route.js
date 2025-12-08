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
    const { data: buildings, error: buildingsError } = await supabase
      .from("buildings")
      .select("id, name, address, city, state, zip, slug")
      .or(`name.ilike.%${q}%,address.ilike.%${q}%`)
      .limit(10);

    if (buildingsError) {
      console.error("Error fetching buildings:", buildingsError);
      return NextResponse.json(
        { error: "Failed to fetch buildings" },
        { status: 500 }
      );
    }

    let units = [];

    // Check if query contains a unit number (has digits)
    const queryWords = q.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    const unitNumberWords = queryWords.filter(word => /\d/.test(word));
    const hasUnitNumber = unitNumberWords.length > 0;

    // ---------------------------------------------------------
    // 1) GET UNITS BY BUILDING MATCH (filter by unit number if present)
    // ---------------------------------------------------------
    if (buildings?.length) {
      const buildingIds = buildings.map((b) => b.id);

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
    // ---------------------------------------------------------
    const { data: unitsByText, error: unitsByTextError } = await supabase
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
      .or(
        [
          `unit_number.ilike.%${q}%`,
          `building.name.ilike.%${q}%`,
          `building.address.ilike.%${q}%`,
          `building.city.ilike.%${q}%`,
          `building.state.ilike.%${q}%`
        ].join(",")
      );

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
