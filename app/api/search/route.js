import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ buildings: [], units: [] });
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL;

    if (!apiUrl) {
      console.error("API URL not configured");
      return NextResponse.json(
        { error: "API URL not configured" },
        { status: 500 }
      );
    }

    // Call the public search API endpoint
    const response = await fetch(
      `${apiUrl}/reports/public/search?query=${encodeURIComponent(q)}`,
      {
        headers: {
          "accept": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error("Error fetching search results from API:", response.status);
      return NextResponse.json(
        { error: "Failed to fetch search results" },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      buildings: data.buildings || [],
      units: data.units || [],
    });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
