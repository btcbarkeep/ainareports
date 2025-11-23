import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req, { params }) {
  try {
    const eventId = params.id;

    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    // Get FastAPI backend URL from environment
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL;
    
    if (!apiUrl) {
      return NextResponse.json(
        { error: "API URL not configured" },
        { status: 500 }
      );
    }

    // Try events endpoint first, fallback to documents endpoint
    // (events with s3_key may be stored the same way as documents)
    let backendUrl = `${apiUrl}/uploads/events/${eventId}/download`;
    
    try {
      let response = await fetch(backendUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(req.headers.get("authorization") && {
            authorization: req.headers.get("authorization"),
          }),
        },
      });

      // If events endpoint returns 404, try documents endpoint
      if (response.status === 404) {
        backendUrl = `${apiUrl}/uploads/documents/${eventId}/download`;
        response = await fetch(backendUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(req.headers.get("authorization") && {
              authorization: req.headers.get("authorization"),
            }),
          },
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("FastAPI error:", response.status, errorText);
        return NextResponse.json(
          { error: "Failed to get event URL", details: errorText, status: response.status },
          { status: response.status }
        );
      }

      const data = await response.json();
      
      // Redirect to the presigned URL
      if (data.download_url) {
        return NextResponse.redirect(data.download_url);
      }

      return NextResponse.json(
        { error: "No download URL in response", data },
        { status: 500 }
      );
    } catch (fetchError) {
      console.error("Fetch error:", fetchError);
      return NextResponse.json(
        { error: "Failed to connect to backend", details: fetchError.message, url: backendUrl },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error fetching event download URL:", error);
    return NextResponse.json(
      { error: "Failed to generate download URL", details: error.message },
      { status: 500 }
    );
  }
}

