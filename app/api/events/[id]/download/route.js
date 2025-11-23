import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabaseClient";

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

    // Fetch the event to check if it has a document_id or s3_key
    const supabase = getSupabaseClient();
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, document_id, s3_key, download_url, document_url")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // If event has a direct download_url or document_url, redirect to it
    if (event.download_url || event.document_url) {
      const directUrl = event.download_url || event.document_url;
      if (directUrl && (directUrl.startsWith('http://') || directUrl.startsWith('https://'))) {
        return NextResponse.redirect(directUrl);
      }
    }

    // If event has a document_id but NO s3_key, try documents endpoint
    // (document_id without s3_key means it's a reference to a separate document)
    if (event.document_id && !event.s3_key) {
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

    // Try events endpoint first (this handles events with s3_key)
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

      // If events endpoint returns 404 and we have an s3_key, try documents endpoint with eventId
      // (some events with s3_key may be stored the same way as documents)
      if (response.status === 404 && event.s3_key) {
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
