import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req, { params }) {
  try {
    const documentId = params.id;

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
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

    // Call FastAPI backend to get presigned URL for documents
    const backendUrl = `${apiUrl}/uploads/documents/${documentId}/download`;
    
    try {
      // Forward the request to FastAPI backend
      const response = await fetch(backendUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Forward authorization if present
          ...(req.headers.get("authorization") && {
            authorization: req.headers.get("authorization"),
          }),
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("FastAPI error:", response.status, errorText);
        return NextResponse.json(
          { error: "Failed to get document URL", details: errorText, status: response.status },
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
    console.error("Error fetching document download URL:", error);
    return NextResponse.json(
      { error: "Failed to generate download URL", details: error.message },
      { status: 500 }
    );
  }
}

