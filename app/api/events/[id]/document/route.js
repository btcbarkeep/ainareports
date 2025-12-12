import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req, { params }) {
  try {
    const { id: eventId } = await params;

    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL;

    if (!apiUrl) {
      return NextResponse.json(
        { error: "API URL not configured" },
        { status: 500 }
      );
    }

    // Try to get event data from backend API
    // Note: This assumes the backend has an endpoint for individual events
    // If not, we'll need to add one, or use the event data already loaded in the page
    try {
      const response = await fetch(
        `${apiUrl}/reports/public/event/${eventId}`,
        {
          headers: {
            "accept": "application/json",
          },
        }
      );

      if (response.ok) {
        const event = await response.json();
        
        // Get unit number from unit_ids array if available
        let unitNumber = null;
        if (event.unit_ids && event.unit_ids.length > 0) {
          // If we have unit data, we could look it up, but for now just use the first unit_id
          // The unit_number should be in the event data from the API
          unitNumber = event.unit_number || null;
        }

        return NextResponse.json({
          id: event.id,
          title: event.title || null,
          event_type: event.event_type || null,
          occurred_at: event.occurred_at || null,
          status: event.status || null,
          body: event.body || null,
          unit_number: unitNumber,
          // Document-related fields
          s3_key: event.s3_key || null,
          download_url: event.download_url || null,
          document_url: event.document_url || null,
          document_id: event.document_id || null,
          // Legacy fields for backward compatibility
          filename: event.title || "Event Document",
          document_type: event.title,
          category: event.category || null,
          created_at: event.occurred_at || event.created_at,
          description: event.description || null,
        });
      } else if (response.status === 404) {
        return NextResponse.json(
          { error: "Event not found" },
          { status: 404 }
        );
      }
    } catch (apiError) {
      console.error("Error fetching event from API:", apiError);
      // Fall through to return error
    }

    // If API call failed, return error
    return NextResponse.json(
      { error: "Event not found or API endpoint not available" },
      { status: 404 }
    );

  } catch (error) {
    console.error("Error fetching event document:", error);
    return NextResponse.json(
      { error: "Failed to fetch document details", details: error.message },
      { status: 500 }
    );
  }
}
