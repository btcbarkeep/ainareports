import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabaseClient";
import EventsList from "@/components/EventsList";
import PremiumUnlockSection from "@/components/PremiumUnlockSection";

const ROLE_LABELS = {
  super_admin: "Admin",
  admin: "Admin",
  property_manager: "Property Manager",
  contractor: "Contractor",
  owner: "Owner",
  manager: "Manager",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

// -------------------------------------------------------------
const TABS = [
  { id: "overview", label: "Overview" },
  { id: "units", label: "Units" },
  { id: "documents", label: "Documents" },
  { id: "events", label: "Events" },
  { id: "contractors", label: "Contractors" },
];

// -------------------------------------------------------------
function formatAddress(building) {
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
// FETCH BUILDING + ALL RELATED DATA
// -------------------------------------------------------------
async function fetchBuildingData(slug) {
  const supabase = getSupabaseClient();

  // CASE-INSENSITIVE MATCH
  const { data: building, error: buildingError } = await supabase
    .from("buildings")
    .select("*")
    .ilike("slug", slug)
    .single();

  if (buildingError || !building) {
    console.error("Building fetch error:", buildingError);
    return null;
  }

  const buildingId = building.id;

  // EVENTS
  const { data: eventsData } = await supabase
    .from("events")
    .select("*")
    .eq("building_id", buildingId)
    .order("occurred_at", { ascending: false });

  const events = eventsData || [];

  // UNIT RESOLUTION FOR EVENTS
  const unitIds = [...new Set(events.map((e) => e.unit_id).filter(Boolean))];
  let unitsByIdFromEvents = {};

  if (unitIds.length > 0) {
    const { data: unitsForEvents } = await supabase
      .from("units")
      .select("id, unit_number")
      .in("id", unitIds);

    (unitsForEvents || []).forEach((u) => {
      unitsByIdFromEvents[u.id] = u;
    });
  }

  const eventsWithUnits = events.map((e) => ({
    ...e,
    unitNumber: e.unit_number || unitsByIdFromEvents[e.unit_id]?.unit_number,
  }));

  // CONTRACTORS
  const contractorIds = [
    ...new Set(events.map((e) => e.contractor_id).filter(Boolean)),
  ];

  let contractorsById = {};

  if (contractorIds.length > 0) {
    const { data: contractors } = await supabase
      .from("contractors")
      .select("id, company_name, phone")
      .in("id", contractorIds);

    (contractors || []).forEach((c) => {
      contractorsById[c.id] = c;
    });
  }

  const counts = {};
  eventsWithUnits.forEach((e) => {
    if (!e.contractor_id) return;
    counts[e.contractor_id] = (counts[e.contractor_id] || 0) + 1;
  });

  const mostActiveContractors = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([id, count]) => ({
      id,
      name: contractorsById[id]?.company_name || "Contractor",
      phone: contractorsById[id]?.phone || "",
      count,
    }));

  // UNITS - Fetch all units (no limit for search functionality)
  const { data: units } = await supabase
    .from("units")
    .select("id, unit_number, floor, owner_name")
    .eq("building_id", buildingId)
    .order("unit_number", { ascending: true });

  // DOCUMENTS
  const { data: documentsData, error: documentsError } = await supabase
    .from("documents")
    .select("*")
    .eq("building_id", buildingId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (documentsError) {
    console.error("Error fetching documents:", documentsError);
  }

  const documents = documentsData || [];

  // TOTAL DOCUMENTS COUNT
  const { count: totalDocumentsCountRaw } = await supabase
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("building_id", buildingId);

  const totalDocumentsCount = totalDocumentsCountRaw ?? 0;

  // TOTAL EVENTS COUNT
  const { count: totalEventsCountRaw } = await supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("building_id", buildingId);

  const totalEventsCount = totalEventsCountRaw ?? 0;

  // USER DISPLAY NAMES
  // Note: Service role key removed, so user display names are not available
  const userDisplayNames = {};

  // LIVE COUNT
  const { count: liveUnitCount } = await supabase
    .from("units")
    .select("id", { count: "exact", head: true })
    .eq("building_id", buildingId);

  const totalUnits =
    (typeof building.units === "number" ? building.units : null) ??
    liveUnitCount ??
    null;

  return {
    building,
    events: eventsWithUnits,
    units: units || [],
    documents: documents || [],
    mostActiveContractors,
    totalUnits,
    floors: building.floors ?? null,
    userDisplayNames,
    totalDocumentsCount: totalDocumentsCount,
    totalEventsCount: totalEventsCount,
    totalContractorsCount: mostActiveContractors.length,
  };
}

// -------------------------------------------------------------
// METADATA
// -------------------------------------------------------------
export async function generateMetadata({ params }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.ainareports.com";
  const data = await fetchBuildingData(params.slug);
  
  if (!data || !data.building) {
    return {
      title: "Building Not Found",
    };
  }

  const building = data.building;
  const address = [building.address, building.city, building.state, building.zip]
    .filter(Boolean)
    .join(", ");
  
  const title = `${building.name} - Building Report | AinaReports`;
  const description = building.description 
    ? `${building.description} View building reports, events, documents, and unit information for ${building.name}${address ? ` located at ${address}` : ""}.`
    : `Building report for ${building.name}${address ? ` located at ${address}` : ""}. View events, documents, contractors, and unit information.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteUrl}/${building.slug}`,
      siteName: "AinaReports",
      type: "website",
      images: [
        {
          url: "/aina-logo-dark.png",
          width: 1200,
          height: 630,
          alt: `${building.name} - AinaReports`,
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
      canonical: `${siteUrl}/${building.slug}`,
    },
  };
}

// -------------------------------------------------------------
// PAGE
// -------------------------------------------------------------
export default async function BuildingPage({ params, searchParams }) {
  const data = await fetchBuildingData(params.slug);

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Building not found.</p>
      </main>
    );
  }

  const {
    building,
    events,
    units,
    documents,
    mostActiveContractors,
    totalUnits,
    floors,
    userDisplayNames,
    totalDocumentsCount,
    totalEventsCount,
    totalContractorsCount,
  } = data;

  // Get unit search query from URL params
  const unitSearchQuery = (searchParams?.unitSearch || "").trim().toLowerCase();

  // Filter units based on search query
  const filteredUnits = unitSearchQuery
    ? units.filter((u) => {
        const unitNum = (u.unit_number || "").toLowerCase();
        const ownerName = (u.owner_name || "").toLowerCase();
        const floor = (u.floor || "").toString().toLowerCase();
        
        // Unit number: match anywhere (e.g., "201" matches "201", "1201", "201A")
        const matchesUnitNumber = unitNum.includes(unitSearchQuery);
        
        // Floor: exact match or includes
        const matchesFloor = floor === unitSearchQuery || floor.includes(unitSearchQuery);
        
        // Owner name: require word boundaries to avoid matching years (e.g., "201" shouldn't match "2012")
        // Match if it's at word boundaries (start of word, end of word, or standalone)
        const ownerNameRegex = new RegExp(`(^|\\s|\\b)${unitSearchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|\\b|$)`, 'i');
        const matchesOwnerName = ownerNameRegex.test(ownerName);
        
        return matchesUnitNumber || matchesOwnerName || matchesFloor;
      }).slice(0, 10) // Limit to 10 results
    : units.slice(0, 10); // Show first 10 units when no search

  const activeTab =
    typeof searchParams?.tab === "string" &&
    TABS.some((t) => t.id === searchParams.tab)
      ? searchParams.tab
      : "overview";

  // Description
  const description =
    building.description ||
    "Description coming soon. This building is connected to live data through Aina Protocol.";

  const addressLine = formatAddress(building);
  const singleMostActive = mostActiveContractors[0] || null;

  // -------------------------------------------------------------
  // HTML OUTPUT
  // -------------------------------------------------------------
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
              <img
                src="/aina-logo-dark.png"
                className="w-14 mx-auto mb-4"
                alt="Aina Logo"
              />
            </Link>
            <div className="text-xs tracking-[0.25em] uppercase">
              AINAREPORTS
            </div>
          </div>
        </header>

        {/* TITLE */}
        <h1 className="text-3xl md:text-4xl font-semibold text-center mb-1">
          {building.name}
        </h1>

        {/* ADDRESS */}
        {addressLine && (
          <p className="text-center text-gray-600">{addressLine}</p>
        )}

        {/* TMK LINE */}
        {building.tmk && (
          <p className="text-center text-gray-500 text-xs mb-6">
            TMK: {building.tmk}
          </p>
        )}

        {/* STATS */}
        <div className="flex justify-center gap-10 mb-8 text-sm">
          <div className="text-center">
            <div className="font-semibold">{totalUnits ?? "—"}</div>
            <div className="text-gray-700 text-xs">Total Units</div>
          </div>

          <div className="text-center">
            <div className="font-semibold">{floors ?? "—"}</div>
            <div className="text-gray-700 text-xs">Floors</div>
          </div>

          <div className="text-center">
            <div className="font-semibold">
              {building.year_built ?? "—"}
            </div>
            <div className="text-gray-700 text-xs">Year Built</div>
          </div>

          <div className="text-center">
            <div className="font-semibold">
              {building.zoning ?? "—"}
            </div>
            <div className="text-gray-700 text-xs">Zoning</div>
          </div>
        </div>

        {/* TABS */}
        <nav className="border-b mb-6">
          <ul className="flex gap-6 text-sm">
            {TABS.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/${building.slug}?tab=${t.id}`}
                  className={
                    activeTab === t.id
                      ? "pb-2 border-b-2 border-black"
                      : "pb-2 text-gray-500 hover:text-black"
                  }
                >
                  {t.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* GRID */}
        <div className="grid md:grid-cols-[3fr,2fr] gap-10">
          {/* LEFT PANEL */}
          <div>
            {/* OVERVIEW */}
            {activeTab === "overview" && (
              <>
                <h2 className="font-semibold mb-2">Description</h2>
                <p className="text-gray-700 text-sm leading-relaxed mb-6">
                  {description}
                </p>
              </>
            )}

            {/* UNITS */}
            {activeTab === "units" && (
              <>
                <h2 className="font-semibold mb-3">Units</h2>
                <div className="border rounded-md divide-y text-sm">
                  <div className="flex px-3 py-2 font-medium text-gray-700">
                    <div className="w-1/4">Unit</div>
                    <div className="w-1/4">Floor</div>
                    <div className="w-2/4">Owner</div>
                  </div>

                  {filteredUnits.length === 0 ? (
                    <div className="px-3 py-3 text-gray-500">
                      {unitSearchQuery
                        ? "No units found matching your search."
                        : "No units found."}
                    </div>
                  ) : (
                    filteredUnits.map((u) => (
                      <div key={u.id} className="flex px-3 py-2">
                        <div className="w-1/4">
                          <Link
                            href={`/${building.slug}/${u.unit_number}`}
                            className="underline hover:text-gray-600"
                          >
                            {u.unit_number}
                          </Link>
                        </div>
                        <div className="w-1/4">{u.floor ?? "—"}</div>
                        <div className="w-2/4">{u.owner_name || "—"}</div>
                      </div>
                    ))
                  )}
                </div>

                {/* Search Units Bar */}
                <div className="mt-4">
                  <form method="GET" className="flex gap-2">
                    <input type="hidden" name="tab" value="units" />
                    <input
                      type="text"
                      name="unitSearch"
                      placeholder="Search units by number, floor, or owner..."
                      defaultValue={unitSearchQuery}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 text-sm"
                    >
                      Search
                    </button>
                    {unitSearchQuery && (
                      <a
                        href={`/${building.slug}?tab=units`}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm flex items-center"
                      >
                        Clear
                      </a>
                    )}
                  </form>
                </div>
              </>
            )}

            {/* DOCUMENTS */}
            {activeTab === "documents" && (
              <>
                <h2 className="font-semibold mb-3">Documents</h2>
                {documents.length === 0 ? (
                  <div className="border rounded-md px-3 py-3 text-gray-500 text-sm">
                    No documents uploaded for this building yet.
                  </div>
                ) : (
                  <>
                    <div className="border rounded-md divide-y text-sm">
                      <div className="flex px-3 py-2 font-semibold text-gray-700">
                        <div className="w-2/5 min-w-0">Name</div>
                        <div className="w-1/5 min-w-0 pl-4">Category</div>
                        <div className="w-2/5 text-right min-w-0 pl-4">Uploaded By</div>
                      </div>
                      {documents.map((doc) => {
                        const documentUrl = doc.download_url || doc.document_url;
                        const filename =
                          doc.title || doc.source || "—";

                        const isValidUrl =
                          documentUrl &&
                          typeof documentUrl === "string" &&
                          documentUrl.trim() !== "" &&
                          (documentUrl.startsWith("http://") ||
                            documentUrl.startsWith("https://"));

                        const downloadLink = isValidUrl
                          ? documentUrl
                          : doc.s3_key
                          ? `/api/documents/${doc.id}/download`
                          : null;

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
                                {doc.uploaded_by &&
                                userDisplayNames[doc.uploaded_by]
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
                    {documents.length >= 5 && totalDocumentsCount > 5 && (
                      <>
                        <p className="text-gray-600 text-sm mt-3">
                          Showing {documents.length} of {totalDocumentsCount} documents
                        </p>
                        <PremiumUnlockSection 
                          itemType="Documents" 
                          buildingName={building.name}
                          totalDocumentsCount={totalDocumentsCount}
                          totalEventsCount={totalEventsCount}
                          totalContractorsCount={totalContractorsCount}
                        />
                      </>
                    )}
                  </>
                )}
              </>
            )}

            {/* CONTRACTORS */}
            {activeTab === "contractors" && (
              <>
                <h2 className="font-semibold mb-3">Contractors</h2>
                {mostActiveContractors.length === 0 ? (
                  <div className="border rounded-md px-3 py-3 text-gray-500 text-sm">
                    No contractors have posted events for this building yet.
                  </div>
                ) : (
                  <>
                    <div className="border rounded-md divide-y text-sm">
                      <div className="flex px-3 py-2 font-semibold text-gray-700">
                        <div className="w-2/5">Name</div>
                        <div className="w-2/5">Phone</div>
                        <div className="w-1/5 text-right">Events</div>
                      </div>
                      {mostActiveContractors.slice(0, 5).map((c) => (
                        <div key={c.id} className="flex px-3 py-2">
                          <div className="w-2/5">{c.name}</div>
                          <div className="w-2/5 text-xs">{c.phone}</div>
                          <div className="w-1/5 text-right text-xs">
                            {c.count}
                          </div>
                        </div>
                      ))}
                    </div>
                    {mostActiveContractors.length >= 5 && (
                      <>
                        <p className="text-gray-600 text-sm mt-3">
                          Showing 5 of {totalContractorsCount} contractors
                        </p>
                        <PremiumUnlockSection 
                          itemType="Contractors" 
                          buildingName={building.name}
                          totalDocumentsCount={totalDocumentsCount}
                          totalEventsCount={totalEventsCount}
                          totalContractorsCount={totalContractorsCount}
                        />
                      </>
                    )}
                  </>
                )}
              </>
            )}

            {/* EVENTS */}
            {activeTab === "events" && (
              <>
                <h2 className="font-semibold mb-3">Events</h2>
                {events.length === 0 ? (
                  <div className="border rounded-md px-3 py-3 text-gray-500 text-sm">
                    No events recorded yet.
                  </div>
                ) : (
                  <>
                    <div className="border rounded-md divide-y text-sm">
                      <div className="flex px-3 py-2 font-semibold text-gray-700">
                        <div className="w-2/5 min-w-0">Event</div>
                        <div className="w-1/5 min-w-0 pl-4">Severity</div>
                        <div className="w-1/5 min-w-0 pl-4">Created By</div>
                        <div className="w-1/5 text-right min-w-0 pl-4">Date</div>
                      </div>

                      <EventsList
                        events={events.slice(0, 5)}
                        userDisplayNames={userDisplayNames}
                      />
                    </div>
                    {events.length >= 5 && totalEventsCount > Math.min(5, events.length) && (
                      <>
                        <p className="text-gray-600 text-sm mt-3">
                          Showing 5 of {totalEventsCount} events
                        </p>
                        <PremiumUnlockSection 
                          itemType="Events" 
                          buildingName={building.name}
                          totalDocumentsCount={totalDocumentsCount}
                          totalEventsCount={totalEventsCount}
                          totalContractorsCount={totalContractorsCount}
                        />
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          {/* RIGHT SIDEBAR */}
          <div>
            {/* PREMIUM CTA */}
            <div>
              {/* PDF CTA - TODO: Implement PDF download API route */}
              <div className="border rounded-md p-4 bg-gray-50 text-sm mb-8 text-center">
                <h3 className="font-semibold mb-1">
                  Premium Building Report (PDF)
                </h3>
                <p className="text-gray-700 text-xs mb-3">
                  Download a full report with complete event history, all
                  documents, contractor activity, and unit details for{" "}
                  <span className="font-medium">
                    {building.name}
                  </span>
                  .
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
              <h2 className="font-semibold text-center mb-3">
                Most Active Contractor
              </h2>
              <div className="border rounded-md text-sm p-3">
                {!singleMostActive ? (
                  <div className="text-gray-500 text-center text-xs">
                    No contractor activity recorded for this building yet.
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="font-medium">
                      {singleMostActive.name}
                    </div>
                    {singleMostActive.phone && (
                      <div className="text-xs text-gray-600 mb-1">
                        {singleMostActive.phone}
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      {singleMostActive.count} recent event
                      {singleMostActive.count > 1 ? "s" : ""}
                    </div>
                  </div>
                )}
              </div>

              {/* MANAGE CTA */}
              <div className="mt-8">
                <p className="text-sm text-center mb-3">
                  Manage this building?
                </p>
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
        </div>
      </div>

      {/* FOOTER MESSAGE */}
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
    </main>
  );
}
