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

    // If event has s3_key, prioritize it (file is stored under events path)
    // Even if event has document_id, if it has s3_key, use events endpoint
    if (event.s3_key || event.download_url || event.document_url) {
      return NextResponse.json({
        id: event.id,
        filename: event.title || "Event Document",
        document_type: event.title,
        category: event.category || null,
        s3_key: event.s3_key || null,
        download_url: event.download_url || null,
        document_url: event.document_url || null,
        created_at: event.occurred_at || event.created_at,
        description: event.description || null,
        document_id: null, // Explicitly null to indicate this is event data, use events endpoint
      });
    }

    // Check if event has a document_id field linking to documents table
    // Only use this if event doesn't have s3_key
    if (event.document_id) {
      const { data: document, error: docError } = await supabase
        .from("documents")
        .select("*")
        .eq("id", event.document_id)
        .single();

      if (docError || !document) {
        return NextResponse.json(
          { error: "Document not found" },
          { status: 404 }
        );
      }

      // Include document_id to indicate this is a real document
      return NextResponse.json({
        ...document,
        document_id: document.id, // Mark this as a real document
      });
    }

    // No document associated with this event
    return NextResponse.json(
      { error: "No document found for this event" },
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
