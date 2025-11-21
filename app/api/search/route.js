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

    // ---------------------------------------------------------
    // 1) GET UNITS BY BUILDING MATCH
    // ---------------------------------------------------------
    if (buildings?.length) {
      const buildingIds = buildings.map((b) => b.id);

      const { data: unitsByBuilding, error: unitsByBuildingError } = await supabase
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
