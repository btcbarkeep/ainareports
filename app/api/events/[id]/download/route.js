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

    // Try multiple approaches to get the download URL
    let response = null;
    let lastError = null;
    
    // Strategy 1: If we have s3_key, try a generic download endpoint with s3_key
    if (event && event.s3_key) {
      try {
        const s3KeyParam = encodeURIComponent(event.s3_key);
        // Try generic download endpoint with s3_key
        let backendUrl = `${apiUrl}/uploads/download?s3_key=${s3KeyParam}`;
        response = await fetch(backendUrl, {
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
      } catch (err) {
        console.error("Error trying generic download endpoint:", err);
      }
    }
    
    // Strategy 2: Try documents endpoint with eventId (events might be stored as documents)
    if (!response || response.status === 404) {
      try {
        let backendUrl = `${apiUrl}/uploads/documents/${eventId}/download`;
        if (event && event.s3_key) {
          const s3KeyParam = encodeURIComponent(event.s3_key);
          backendUrl += `?s3_key=${s3KeyParam}`;
        }
        response = await fetch(backendUrl, {
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
      } catch (err) {
        console.error("Error trying documents endpoint:", err);
        lastError = err;
      }
    }
    
    // Strategy 3: Try events endpoint (if it exists)
    if (!response || response.status === 404) {
      try {
        let backendUrl = `${apiUrl}/uploads/events/${eventId}/download`;
        if (event && event.s3_key) {
          const s3KeyParam = encodeURIComponent(event.s3_key);
          backendUrl += `?s3_key=${s3KeyParam}`;
        }
        response = await fetch(backendUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(req.headers.get("authorization") && {
              authorization: req.headers.get("authorization"),
            }),
          },
        });
      } catch (err) {
        console.error("Error trying events endpoint:", err);
        lastError = err;
      }
    }
    
    // If we still don't have a successful response, return error
    if (!response || !response.ok) {
      const errorText = response ? await response.text() : (lastError?.message || "No response from backend");
      const statusCode = response?.status || 404;
      console.error("FastAPI error:", statusCode, errorText);
      return NextResponse.json(
        { error: "Failed to get event URL", details: errorText, status: statusCode },
        { status: statusCode }
      );
    }

    // If we have a successful response, get the download URL
    const data = await response.json();
    
    // Redirect to the presigned URL
    if (data.download_url) {
      return NextResponse.redirect(data.download_url);
    }

    return NextResponse.json(
      { error: "No download URL in response", data },
      { status: 500 }
    );
  } catch (error) {
    console.error("Error fetching event download URL:", error);
    return NextResponse.json(
      { error: "Failed to generate download URL", details: error.message },
      { status: 500 }
    );
  }
}
