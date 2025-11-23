import Link from "next/link";
import { getSupabaseClient, getSupabaseAdminClient } from "@/lib/supabaseClient";
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

    // 1️⃣ Fetch building
    const { data: building, error: buildingError } = await supabase
      .from("buildings")
      .select("*")
      .ilike("slug", buildingSlug)
      .single();

    if (buildingError || !building) {
      console.error("Error fetching building:", buildingError);
      return null;
    }

    // 2️⃣ Fetch unit
    const { data: unit, error: unitError } = await supabase
      .from("units")
      .select("*")
      .eq("building_id", building.id)
      .ilike("unit_number", unitNumber)
      .single();

    if (unitError || !unit) {
      console.error("Error fetching unit:", unitError);
      return null;
    }

    // 3️⃣ Fetch EVENTS (limit 5)
    const { data: eventsData, error: eventsError } = await supabase
      .from("events")
      .select("*")
      .eq("unit_id", unit.id)
      .order("occurred_at", { ascending: false })
      .limit(5);

    if (eventsError) {
      console.error("Error fetching events:", eventsError);
    }

    const events = eventsData || [];

    // 4️⃣ Fetch DOCUMENTS (limit 5)
    const { data: documentsData, error: documentsError } = await supabase
      .from("documents")
      .select("*")
      .eq("unit_id", unit.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (documentsError) {
      console.error("Error fetching documents:", documentsError);
    }

    const documents = documentsData || [];

  // 5️⃣ Fetch Auth Users
  let userDisplayNames = {};
  try {
    const admin = getSupabaseAdminClient();
    const { data: userList } = await admin.auth.admin.listUsers();

    (userList?.users || []).forEach((u) => {
      const meta = u.user_metadata || u.raw_user_meta_data || {};

      userDisplayNames[u.id] = {
        name: meta.full_name || u.email || "Unknown User",
        role: ROLE_LABELS[meta.role] || meta.role || "—",
      };
    });
  } catch (err) {
    console.error("Auth user fetch failed:", err);
  }

    // 6️⃣ CONTRACTORS (unit level)
    const contractorIds = [...new Set(events.map((e) => e.contractor_id).filter(Boolean))];

    let contractorsById = {};
    if (contractorIds.length > 0) {
      const { data: contractors, error: contractorsError } = await supabase
        .from("contractors")
        .select("id, company_name, phone")
        .in("id", contractorIds);

      if (contractorsError) {
        console.error("Error fetching contractors:", contractorsError);
      } else {
        (contractors || []).forEach((c) => {
          contractorsById[c.id] = c;
        });
      }
    }

  // Contractor activity count
  const contractorCounts = {};
  events.forEach((e) => {
    if (!e.contractor_id) return;
    contractorCounts[e.contractor_id] = (contractorCounts[e.contractor_id] || 0) + 1;
  });

  // Most active contractor (ONLY 1)
  const [topContractorId] =
    Object.entries(contractorCounts).sort((a, b) => b[1] - a[1])[0] || [];

  let mostActiveContractor = null;
  if (topContractorId) {
    const c = contractorsById[topContractorId] || {};
    mostActiveContractor = {
      id: topContractorId,
      name: c.company_name || "Contractor",
      phone: c.phone || "",
      count: contractorCounts[topContractorId],
    };
  }

    // 7️⃣ BUILDING contractors (limit 5)
    const { data: buildingContractorEvents, error: buildingEventsError } = await supabase
      .from("events")
      .select("contractor_id")
      .eq("building_id", building.id)
      .not("contractor_id", "is", null);

    if (buildingEventsError) {
      console.error("Error fetching building contractor events:", buildingEventsError);
    }

    const buildingContractorIds = [
      ...new Set((buildingContractorEvents || []).map((e) => e.contractor_id)),
    ];

    let buildingContractors = [];
    if (buildingContractorIds.length > 0) {
      const { data: contractors, error: buildingContractorsError } = await supabase
        .from("contractors")
        .select("id, company_name, phone")
        .in("id", buildingContractorIds)
        .limit(5);

      if (buildingContractorsError) {
        console.error("Error fetching building contractors:", buildingContractorsError);
      } else {
        buildingContractors = contractors || [];
      }
    }

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
                      <div className="w-2/5 min-w-0">Filename</div>
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
