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
    // If this fails, we'll still try the FastAPI endpoints as fallback
    let event = null;
    const supabase = getSupabaseClient();
    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .select("id, document_id, s3_key, download_url, document_url")
      .eq("id", eventId)
      .single();

    if (eventError) {
      console.error("Error fetching event from Supabase:", eventError);
      // Don't fail here - continue to try FastAPI endpoints
      // The event might exist in the backend even if not in Supabase
    } else {
      event = eventData;
    }

    // If we successfully fetched the event and it has a direct download_url or document_url, redirect to it
    if (event && (event.download_url || event.document_url)) {
      const directUrl = event.download_url || event.document_url;
      if (directUrl && (directUrl.startsWith('http://') || directUrl.startsWith('https://'))) {
        return NextResponse.redirect(directUrl);
      }
    }

    // If event has a document_id but NO s3_key, try documents endpoint
    // (document_id without s3_key means it's a reference to a separate document)
    if (event && event.document_id && !event.s3_key) {
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
    // If we have an s3_key, pass it as a query parameter
    let backendUrl = `${apiUrl}/uploads/events/${eventId}/download`;
    if (event && event.s3_key) {
      const s3KeyParam = encodeURIComponent(event.s3_key);
      backendUrl += `?s3_key=${s3KeyParam}`;
    }
    
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

      // If events endpoint returns 404, try alternative approaches
      if (response.status === 404) {
        // Try documents endpoint with eventId (some events with s3_key may be stored as documents)
        if (event && event.s3_key) {
          let altBackendUrl = `${apiUrl}/uploads/documents/${eventId}/download`;
          if (event.s3_key) {
            const s3KeyParam = encodeURIComponent(event.s3_key);
            altBackendUrl += `?s3_key=${s3KeyParam}`;
          }
          response = await fetch(altBackendUrl, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(req.headers.get("authorization") && {
                authorization: req.headers.get("authorization"),
              }),
            },
          });
        }
        
        // If still 404, try without s3_key parameter (maybe backend doesn't need it)
        if (response.status === 404) {
          backendUrl = `${apiUrl}/uploads/events/${eventId}/download`;
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
