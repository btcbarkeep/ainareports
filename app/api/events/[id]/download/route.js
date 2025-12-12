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

    // Get FastAPI backend URL from environment
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL;
    
    if (!apiUrl) {
      return NextResponse.json(
        { error: "API URL not configured" },
        { status: 500 }
      );
    }

    // Try to get event data from backend API
    let event = null;
    try {
      const eventResponse = await fetch(
        `${apiUrl}/reports/public/event/${eventId}`,
        {
          headers: {
            "accept": "application/json",
          },
        }
      );

      if (eventResponse.ok) {
        event = await eventResponse.json();
      }
    } catch (apiError) {
      console.error("Error fetching event from API:", apiError);
      // Continue to try download endpoints
    }

    // If we successfully fetched the event and it has a direct download_url or document_url, redirect to it
    if (event && (event.download_url || event.document_url)) {
      const directUrl = event.download_url || event.document_url;
      if (directUrl && (directUrl.startsWith('http://') || directUrl.startsWith('https://'))) {
        return NextResponse.redirect(directUrl);
      }
    }

    // If event has a document_id, use that document's ID
    if (event && event.document_id) {
      const backendUrl = `${apiUrl}/uploads/documents/${event.document_id}/download`;
      try {
        const response = await fetch(backendUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(req.headers.get("authorization") && {
              authorization: req.headers.get("authorization"),
            }),
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.download_url) {
            return NextResponse.redirect(data.download_url);
          }
        }
      } catch (fetchError) {
        console.error("Error fetching document download:", fetchError);
      }
    }

    // If event has s3_key, try documents endpoint with s3_key as query parameter
    if (event && event.s3_key) {
      try {
        const s3KeyParam = encodeURIComponent(event.s3_key);
        const backendUrl = `${apiUrl}/uploads/documents/${eventId}/download?s3_key=${s3KeyParam}`;
        const response = await fetch(backendUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(req.headers.get("authorization") && {
              authorization: req.headers.get("authorization"),
            }),
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.download_url) {
            return NextResponse.redirect(data.download_url);
          }
        } else {
          console.log(`Documents endpoint with s3_key param failed, status: ${response.status}`);
        }
      } catch (fetchError) {
        console.error("Error trying documents endpoint with s3_key param:", fetchError);
      }
    }

    // Fallback: try documents endpoint with eventId (in case backend handles it)
    const backendUrl = `${apiUrl}/uploads/documents/${eventId}/download`;
    
    try {
      const response = await fetch(backendUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(req.headers.get("authorization") && {
            authorization: req.headers.get("authorization"),
          }),
        },
      });

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
