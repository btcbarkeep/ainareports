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

    const supabase = getSupabaseClient();

    // First, get the event to check if it has a document_id or s3_key
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // If event has s3_key but no document_id, try to find the document with that s3_key
    let foundDocumentId = event.document_id || null;
    if (event.s3_key && !event.document_id) {
      const { data: document, error: docError } = await supabase
        .from("documents")
        .select("id")
        .eq("s3_key", event.s3_key)
        .limit(1)
        .maybeSingle();
      
      if (!docError && document && document.id) {
        foundDocumentId = document.id;
      }
    }

    // Return event data with all event fields
    return NextResponse.json({
      id: event.id,
      title: event.title || null,
      event_type: event.event_type || null,
      occurred_at: event.occurred_at || null,
      status: event.status || null,
      body: event.body || null,
      // Document-related fields
      s3_key: event.s3_key || null,
      download_url: event.download_url || null,
      document_url: event.document_url || null,
      document_id: foundDocumentId, // Use found document ID if available
      // Legacy fields for backward compatibility
      filename: event.title || "Event Document",
      document_type: event.title,
      category: event.category || null,
      created_at: event.occurred_at || event.created_at,
      description: event.description || null,
    });

  } catch (error) {
    console.error("Error fetching event document:", error);
    return NextResponse.json(
      { error: "Failed to fetch document details", details: error.message },
      { status: 500 }
    );
  }
}
