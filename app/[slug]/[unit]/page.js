import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabaseClient";
import EventsList from "@/components/EventsList";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// -------------------------------------------------------------
// ROLE LABEL MAP
// -------------------------------------------------------------
const ROLE_LABELS = {
  super_admin: "Admin",
  admin: "Admin",
  property_manager: "Property Manager",
  hoa: "HOA Manager",
  contractor: "Contractor",
};

// -------------------------------------------------------------
// FETCH UNIT + BUILDING + EVENTS + CONTRACTORS + AUTH USERS
// -------------------------------------------------------------
async function fetchUnitWithRelations(buildingSlug, unitNumber) {
  try {
    const supabase = getSupabaseClient();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL;

    // 1️⃣ Fetch building and unit in parallel
    const [buildingResult, unitQuery] = await Promise.all([
      supabase
        .from("buildings")
        .select("id, slug, name, address, city, state, zip, description, units, floors, year_built, zoning, tmk")
        .ilike("slug", buildingSlug)
        .single(),
      // We need building first to query unit, but we can prepare the query
      Promise.resolve(null), // Placeholder
    ]);

    const { data: building, error: buildingError } = buildingResult;

    if (buildingError || !building) {
      console.error("Error fetching building:", buildingError);
      return null;
    }

    // 2️⃣ Fetch unit and API data in parallel
    const [unitResult, apiResult] = await Promise.allSettled([
      supabase
        .from("units")
        .select("*")
        .eq("building_id", building.id)
        .ilike("unit_number", unitNumber)
        .single(),
      // API call with timeout
      apiUrl ? Promise.race([
        fetch(
          `${apiUrl}/reports/public/building/${building.id}/unit/${unitNumber}`,
          {
            headers: {
              "accept": "application/json",
            },
            next: { revalidate: 60 }, // Cache for 60 seconds
          }
        ),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('API timeout')), 3000)
        )
      ]).catch(() => null) : Promise.resolve(null),
    ]);

    const { data: unit, error: unitError } = unitResult.status === 'fulfilled' ? unitResult.value : { data: null, error: null };

    if (unitError || !unit) {
      console.error("Error fetching unit:", unitError);
      return null;
    }

    // Process API result
    let publicData = null;
    if (apiResult.status === 'fulfilled' && apiResult.value) {
      try {
        const response = apiResult.value;
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            publicData = result.data;
          }
        }
      } catch (apiError) {
        console.error("Error parsing API response:", apiError);
      }
    }

    // Fallback to Supabase if API fails or is not configured
    if (!publicData) {
      const [eventsResult, documentsResult] = await Promise.allSettled([
        supabase
          .from("events")
          .select("*")
          .eq("unit_id", unit.id)
          .order("occurred_at", { ascending: false })
          .limit(5),
        supabase
          .from("documents")
          .select("*")
          .eq("unit_id", unit.id)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      publicData = {
        events: eventsResult.status === 'fulfilled' ? (eventsResult.value.data || []) : [],
        documents: documentsResult.status === 'fulfilled' ? (documentsResult.value.data || []) : [],
        contractors: [],
        property_managers: [],
      };
    }

    const events = publicData.events || [];
    const documents = publicData.documents || [];

    // Map contractors from API response
    const unitContractors = publicData.contractors || [];
    const mostActiveContractor = unitContractors.length > 0
      ? {
          id: unitContractors[0].id || 0,
          name: unitContractors[0].company_name || unitContractors[0].name || "Contractor",
          phone: unitContractors[0].phone || "",
          count: unitContractors[0].event_count || unitContractors[0].count || 0,
        }
      : null;

    // Building contractors from API (if available) or fallback
    const buildingContractors = (publicData.building_contractors || publicData.contractors || []).slice(0, 5).map((c) => ({
      id: c.id,
      company_name: c.company_name || c.name,
      phone: c.phone || "",
    }));

    // USER DISPLAY NAMES
    const userDisplayNames = {};

    return {
      building,
      unit,
      events,
      documents,
      mostActiveContractor,
      buildingContractors,
      userDisplayNames,
    };
  } catch (error) {
    console.error("Error in fetchUnitWithRelations:", error);
    return null;
  }
}

// -------------------------------------------------------------
function formatAddress(building) {
  if (!building) return "";
  const parts = [
    building.address,
    building.city,
    building.state ? building.state.toUpperCase() : null,
    building.zip,
  ].filter(Boolean);

  return parts.join(", ");
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" });
}

// -------------------------------------------------------------
// METADATA
// -------------------------------------------------------------
export async function generateMetadata({ params }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.ainareports.com";
  const result = await fetchUnitWithRelations(params.slug, params.unit);
  
  if (!result || !result.unit || !result.building) {
    return {
      title: "Unit Not Found",
    };
  }

  const { unit, building } = result;
  const address = [building.address, building.city, building.state, building.zip]
    .filter(Boolean)
    .join(", ");
  
  const title = `Unit ${unit.unit_number} - ${building.name} | AinaReports`;
  const description = `Unit report for Unit ${unit.unit_number} at ${building.name}${address ? ` located at ${address}` : ""}. View events, documents, contractor activity, and unit details.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteUrl}/${building.slug}/${unit.unit_number}`,
      siteName: "AinaReports",
      type: "website",
      images: [
        {
          url: "/aina-logo-dark.png",
          width: 1200,
          height: 630,
          alt: `Unit ${unit.unit_number} - ${building.name} - AinaReports`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/aina-logo-dark.png"],
    },
    alternates: {
      canonical: `${siteUrl}/${building.slug}/${unit.unit_number}`,
    },
  };
}

// -------------------------------------------------------------
// PAGE
// -------------------------------------------------------------
export default async function UnitPage({ params, searchParams }) {
  const activeTab = searchParams?.tab || "details";

  const result = await fetchUnitWithRelations(params.slug, params.unit);
  if (!result) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600 text-sm">Unit not found.</p>
      </main>
    );
  }

  const {
    building,
    unit,
    events,
    documents,
    mostActiveContractor,
    buildingContractors,
    userDisplayNames,
  } = result;

  const addressLine = formatAddress(building);

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* LOGO */}
        <header className="relative mb-10">
          <Link
            href="/"
            className="absolute top-0 left-0 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <span>←</span> New Search
          </Link>
          <div className="text-center">
            <Link href="/" className="inline-block cursor-pointer">
              <img src="/aina-logo-dark.png" className="w-14 mx-auto mb-4" alt="Aina Logo" />
            </Link>
            <div className="text-xs tracking-[0.25em] uppercase">AINAREPORTS</div>
          </div>
        </header>

        {/* TITLE SECTION */}
        <section className="text-center mb-6">

          {/* TOP LINE — UNIT NUMBER ONLY */}
          <h1 className="text-4xl md:text-5xl font-semibold mb-1">
            {unit.unit_number}
          </h1>

          {/* SECOND LINE — BUILDING NAME ONLY */}
          <Link
            href={`/${building.slug}`}
            className="text-lg md:text-xl text-gray-700 hover:text-gray-900 underline hover:no-underline"
          >
            {building.name}
          </Link>

          {/* ADDRESS */}
          {addressLine && (
            <p className="text-gray-600 text-sm md:text-base mt-2">{addressLine}</p>
          )}

          {/* PARCEL */}
          {unit.parcel_number && (
            <p className="text-gray-600 text-sm mt-1">
              Parcel #: {unit.parcel_number}
            </p>
          )}
        </section>

        {/* TABS */}
        <nav className="border-b mb-6 text-sm md:text-base">
          <ul className="flex gap-6">
            {[
              { id: "details", label: "Details" },
              { id: "documents", label: "Documents" },
              { id: "events", label: "Events" },
              { id: "contractors", label: "Contractors" },
            ].map((tab) => (
              <li key={tab.id}>
                <a
                  href={`/${building.slug}/${unit.unit_number}?tab=${tab.id}`}
                  className={
                    activeTab === tab.id
                      ? "pb-2 border-b-2 border-black"
                      : "pb-2 text-gray-500 hover:text-black"
                  }
                >
                  {tab.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* GRID */}
        <div className="grid md:grid-cols-[3fr,2fr] gap-10">
          <div>
            {/* ---------------- DETAILS TAB ---------------- */}
            {activeTab === "details" && (
              <>
                <h2 className="font-semibold mb-3">Unit Details</h2>

                <div className="border rounded-md divide-y text-sm mb-8">
                  <div className="flex px-3 py-2">
                    <div className="w-1/2">Owner Name:</div>
                    <div className="w-1/2">{unit.owner_name || "—"}</div>
                  </div>
                  <div className="flex px-3 py-2">
                    <div className="w-1/2">Beds:</div>
                    <div className="w-1/2">{unit.bedrooms ?? "—"}</div>
                  </div>
                  <div className="flex px-3 py-2">
                    <div className="w-1/2">Baths:</div>
                    <div className="w-1/2">{unit.bathrooms ?? "—"}</div>
                  </div>
                  <div className="flex px-3 py-2">
                    <div className="w-1/2">Floor:</div>
                    <div className="w-1/2">{unit.floor ?? "—"}</div>
                  </div>
                  <div className="flex px-3 py-2">
                    <div className="w-1/2">Square Feet:</div>
                    <div className="w-1/2">{unit.square_feet ?? "—"}</div>
                  </div>
                </div>

                {/* BUILDING DETAILS */}
                <h2 className="font-semibold mb-3">Building Details</h2>
                <div className="border rounded-md divide-y text-sm mb-8">
                  <div className="flex px-3 py-2">
                    <div className="w-1/2">Zoning:</div>
                    <div className="w-1/2">{building.zoning || "—"}</div>
                  </div>
                  <div className="flex px-3 py-2">
                    <div className="w-1/2">Year Built:</div>
                    <div className="w-1/2">{building.year_built || "—"}</div>
                  </div>
                  <div className="flex px-3 py-2">
                    <div className="w-1/2">Total Units:</div>
                    <div className="w-1/2">{building.units ?? "—"}</div>
                  </div>
                </div>
              </>
            )}

            {/* ---------------- DOCUMENTS TAB ---------------- */}
            {activeTab === "documents" && (
              <>
                <h2 className="font-semibold mb-3">Documents</h2>
                {documents.length === 0 ? (
                  <p className="text-gray-500 text-sm">No documents available.</p>
                ) : (
                  <div className="border rounded-md divide-y text-sm">
                    <div className="flex px-3 py-2 font-semibold text-gray-700">
                      <div className="w-2/5 min-w-0">Name</div>
                      <div className="w-1/5 min-w-0 pl-4">Category</div>
                      <div className="w-2/5 text-right min-w-0 pl-4">Uploaded By</div>
                    </div>
                    {documents.map((doc) => {
                      // Use download_url/document_url if available, otherwise use Next.js API route
                      const documentUrl = doc.download_url || doc.document_url;
                      const filename = doc.filename || doc.document_type || "—";
                      
                      // Check if it's a valid URL (starts with http:// or https://)
                      const isValidUrl = documentUrl && 
                        typeof documentUrl === 'string' && 
                        documentUrl.trim() !== '' &&
                        (documentUrl.startsWith('http://') || documentUrl.startsWith('https://'));
                      
                      // If no direct URL but we have s3_key, use Next.js API route (which proxies to FastAPI)
                      const downloadLink = isValidUrl 
                        ? documentUrl 
                        : (doc.s3_key ? `/api/documents/${doc.id}/download` : null);
                      
                      return (
                        <div key={doc.id} className="flex px-3 py-2">
                          <div className="w-2/5 min-w-0 pr-4 overflow-hidden">
                            {downloadLink ? (
                              <a
                                href={downloadLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium underline hover:text-gray-600 cursor-pointer text-blue-600 truncate block"
                                title={filename}
                              >
                                {filename}
                              </a>
                            ) : (
                              <div className="font-medium truncate" title={filename}>{filename}</div>
                            )}
                          </div>
                          <div className="w-1/5 text-xs min-w-0 pl-4 pr-4 overflow-hidden">
                            <div className="truncate" title={doc.category || "—"}>
                              {doc.category || "—"}
                            </div>
                          </div>
                          <div className="w-2/5 text-right text-xs min-w-0 pl-4 overflow-hidden">
                            <div className="truncate" title={
                              (doc.uploaded_by && userDisplayNames[doc.uploaded_by]
                                ? userDisplayNames[doc.uploaded_by].role
                                : "—") + " " + formatDate(doc.created_at)
                            }>
                              {doc.uploaded_by && userDisplayNames[doc.uploaded_by]
                                ? userDisplayNames[doc.uploaded_by].role
                                : "—"}
                              <span className="ml-2 text-gray-500">
                                {formatDate(doc.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* ---------------- EVENTS TAB ---------------- */}
            {activeTab === "events" && (
              <>
                <h2 className="font-semibold mb-3">Events</h2>

                <div className="border rounded-md divide-y text-sm">
                  <div className="flex px-3 py-2 font-semibold text-gray-700">
                    <div className="w-2/5 min-w-0">Event</div>
                    <div className="w-1/5 min-w-0 pl-4">Severity</div>
                    <div className="w-1/5 min-w-0 pl-4">Created By</div>
                    <div className="w-1/5 text-right min-w-0 pl-4">Date</div>
                  </div>

                  <EventsList
                    events={events}
                    userDisplayNames={userDisplayNames}
                  />
                </div>
              </>
            )}

            {/* ---------------- CONTRACTORS TAB ---------------- */}
            {activeTab === "contractors" && (
              <>
                <h2 className="font-semibold mb-3">Contractors</h2>

                <div className="border rounded-md divide-y text-sm">
                  {buildingContractors.length === 0 ? (
                    <div className="px-3 py-3 text-gray-500">
                      No contractors have posted events for this building yet.
                    </div>
                  ) : (
                    buildingContractors.map((c) => (
                      <div key={c.id} className="px-3 py-3">
                        <div className="font-medium">{c.company_name}</div>
                        <div className="text-xs text-gray-600">{c.phone || "—"}</div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          {/* ---------------- RIGHT SIDEBAR ---------------- */}
          <div>
            {/* PDF CTA - TODO: Implement PDF download API route */}
            <div className="border rounded-md p-4 bg-gray-50 text-sm mb-8 text-center">
              <h3 className="font-semibold mb-1">Premium Building Report (PDF)</h3>
              <p className="text-gray-700 text-xs mb-3">
                Download a full report with complete event history, all documents,
                contractor activity, and unit details for{" "}
                <span className="font-medium">{building.name}</span>.
              </p>
              <button
                disabled
                className="block w-full text-center border border-gray-400 rounded-md py-2 text-xs font-medium text-gray-500 cursor-not-allowed"
                title="PDF download coming soon"
              >
                Download Full Report (PDF) - Coming Soon
              </button>
            </div>

            {/* MOST ACTIVE CONTRACTOR */}
            <h2 className="font-semibold mb-3 text-center">Most Active Contractor</h2>

            <div className="border rounded-md text-sm p-3">
              {!mostActiveContractor ? (
                <div className="text-gray-500 text-center text-xs">
                  No contractor activity recorded for this unit yet.
                </div>
              ) : (
                <div className="text-center">
                  <div className="font-medium">{mostActiveContractor.name}</div>
                  {mostActiveContractor.phone && (
                    <div className="text-gray-600 text-xs mb-1">
                      {mostActiveContractor.phone}
                    </div>
                  )}
                  <div className="text-gray-500 text-xs">
                    {mostActiveContractor.count} recent event
                    {mostActiveContractor.count > 1 ? "s" : ""}
                  </div>
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="mt-8">
                <p className="text-sm text-center mb-3">Owner or manager of this unit?</p>
                <a
                  href="https://www.ainaprotocol.com/signup/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center border border-black rounded-md py-2 text-sm"
                >
                  Register with Aina Protocol
                </a>
              </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-20 pb-10 text-center text-xs text-gray-400">
          This building is connected to live data through{" "}
          <a
            href="https://ainaprotocol.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-900 underline"
          >
            Aina Protocol
          </a>
          .
        </div>
      </div>
    </main>
  );
}
