import { cache } from "react";
import Link from "next/link";
import EventsList from "@/components/EventsList";
import DocumentsList from "@/components/DocumentsList";
import ContractorsList from "@/components/ContractorsList";
import PropertyManagementList from "@/components/PropertyManagementList";
import PremiumUnlockSection from "@/components/PremiumUnlockSection";
import AOAOBox from "@/components/AOAOBox";

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
  { id: "documents", label: "Docs" },
  { id: "events", label: "Events" },
  { id: "property_management", label: "Mgmt" },
  { id: "contractors", label: "Vendors" },
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
// Use cache to ensure request deduplication between generateMetadata and page component
const fetchBuildingData = cache(async (slug) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL;

  if (!apiUrl) {
    console.error("API URL not configured");
    return null;
  }

  if (!slug) {
    console.error("Slug is required");
    return null;
  }

  // Fetch building report from API using slug directly
  let publicData = null;
  try {
    const apiEndpoint = `${apiUrl}/reports/public/building/${slug}?format=json`;
    
    const response = await fetch(
      apiEndpoint,
      {
        headers: {
          "accept": "application/json",
        },
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    );

    if (response.ok) {
      const result = await response.json();
      publicData = result;
    } else {
      const errorText = await response.text().catch(() => '');
      console.error(`Error fetching building data from API: ${response.status}`, errorText);
      return null;
    }
  } catch (apiError) {
    console.error("Error calling building API:", apiError);
    return null;
  }

  if (!publicData) {
    console.error("No data returned from API");
    return null;
  }

  // Extract data from API response
  // Handle different possible response structures:
  // 1. { building: {...}, units: [...], ... }
  // 2. { data: { building: {...}, ... } }
  // 3. Building data at root level
  let apiBuilding = null;
  
  // Check for nested data structure first
  if (publicData.data && publicData.data.building) {
    apiBuilding = publicData.data.building;
    publicData = {
      ...publicData.data,
      building: apiBuilding,
    };
  } else if (publicData.building) {
    // Standard structure: { building: {...}, units: [...], ... }
    apiBuilding = publicData.building;
  } else if (publicData.id && publicData.name) {
    // The response might be the building object itself
    apiBuilding = publicData;
    // Extract other data if present, or create structure
    publicData = {
      building: apiBuilding,
      units: publicData.units || [],
      events: publicData.events || [],
      documents: publicData.documents || [],
      contractors: publicData.contractors || [],
      statistics: publicData.statistics || {},
    };
  }
  
  if (!apiBuilding) {
    return null;
  }
  const apiUnits = publicData.units || [];
  const apiEvents = publicData.events || [];
  const apiDocuments = publicData.documents || [];
  const apiContractors = publicData.contractors || [];
  const statistics = publicData.statistics || {};
  // Extract AOAO organizations (use first one if multiple)
  const aoaoOrganizations = publicData.aoao_organizations || [];
  const aoao = aoaoOrganizations.length > 0 ? aoaoOrganizations[0] : null;
  // Extract property management companies (all from report)
  const apiPropertyManagers = publicData.property_management_companies || [];

  // Create a map of unit_id -> unit_number for looking up unit numbers
  const unitMap = new Map();
  apiUnits.forEach((unit) => {
    unitMap.set(unit.id, unit.unit_number);
  });

  // Create a map of event_id -> document for quick lookup
  const eventDocumentMap = new Map();
  apiDocuments.forEach((doc) => {
    if (doc.event_id) {
      eventDocumentMap.set(doc.event_id, doc);
    }
  });

  // Map events: use unit_ids array to look up unit numbers
  const events = apiEvents.map((e) => {
    // Events have unit_ids array - get the first unit number if available
    const unitNumbers = (e.unit_ids || [])
      .map((uid) => unitMap.get(uid))
      .filter(Boolean);
    
    // Find associated document if it exists
    const associatedDoc = eventDocumentMap.get(e.id);
    
    return {
      ...e,
      unitNumber: unitNumbers.length > 0 ? unitNumbers[0] : null,
      unitNumbers: unitNumbers, // Keep all unit numbers for reference
      units_affected: e.units_affected, // Keep units_affected string for reference
      // Add document_id from associated document if available
      document_id: e.document_id || associatedDoc?.id || null,
    };
  });

  // Map documents: use unit_ids array to look up unit numbers
  const documents = apiDocuments.map((d) => {
    const unitNumbers = (d.unit_ids || [])
      .map((uid) => unitMap.get(uid))
      .filter(Boolean);
    
    return {
      ...d,
      unitNumbers: unitNumbers,
    };
  });

  // Map contractors from API response
  const mappedContractors = apiContractors.map((c, index) => {
    return {
      id: c.id || `contractor-${index}`,
      company_name: c.company_name || c.name || "Contractor",
      name: c.company_name || c.name || "Contractor",
      phone: c.contact_phone || c.phone || "",
      count: c.event_count || c.count || 0,
      address: c.address,
      city: c.city,
      state: c.state,
      zip_code: c.zip_code || c.zip,
      email: c.contact_email || c.email,
      contact_person: c.contact_person,
      website: c.website,
      license_number: c.license_number,
      insurance_info: c.insurance_info,
      notes: c.notes,
      roles: c.roles,
      subscription_tier: c.subscription_tier,
      created_at: c.created_at,
      logo_url: c.logo_url,
    };
  });

  // Sort contractors: Certified first, then by event count descending
  const mostActiveContractors = mappedContractors.sort((a, b) => {
    const aIsPaid = a.subscription_tier === "paid";
    const bIsPaid = b.subscription_tier === "paid";
    
    // If one is paid and the other isn't, paid comes first
    if (aIsPaid && !bIsPaid) return -1;
    if (!aIsPaid && bIsPaid) return 1;
    
    // Both same certification status, sort by event count descending
    return b.count - a.count;
  });

  // USER DISPLAY NAMES
  const userDisplayNames = {};

  if (!apiBuilding) {
    return null;
  }

  return {
    building: apiBuilding,
    events,
    units: apiUnits.map((u) => ({
      id: u.id,
      unit_number: u.unit_number,
      floor: u.floor,
      owner_name: u.owner_name,
    })),
    documents,
    mostActiveContractors,
    propertyManagers: apiPropertyManagers.map((pm) => ({
      id: pm.id,
      company_name: pm.company_name || pm.name,
      name: pm.company_name || pm.name,
      phone: pm.contact_phone || pm.phone || "",
      address: pm.address,
      city: pm.city,
      state: pm.state,
      zip_code: pm.zip_code || pm.zip,
      email: pm.contact_email || pm.email,
      contact_person: pm.contact_person,
      website: pm.website,
      notes: pm.notes,
      unit_count: pm.unit_count,
      subscription_tier: pm.subscription_tier,
      license_number: pm.license_number || pm.license,
      logo_url: pm.logo_url,
      created_at: pm.created_at,
    })),
    aoao,
    totalUnits: statistics.total_units ?? apiUnits.length ?? apiBuilding.units ?? null,
    floors: apiBuilding?.floors ?? null,
    userDisplayNames,
    totalDocumentsCount: statistics.total_documents ?? apiDocuments.length ?? 0,
    totalEventsCount: statistics.total_events ?? apiEvents.length ?? 0,
    totalContractorsCount: statistics.total_contractors ?? apiContractors.length ?? 0,
    totalPropertyManagersCount: statistics.total_pm_companies ?? apiPropertyManagers.length ?? 0,
  };
});

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
    propertyManagers,
    aoao,
    totalUnits,
    floors,
    userDisplayNames,
    totalDocumentsCount,
    totalEventsCount,
    totalContractorsCount,
    totalPropertyManagersCount,
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
      }).slice(0, 5) // Limit to 5 results
    : units.slice(0, 5); // Show first 5 units when no search

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
                <AOAOBox aoao={aoao} />
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
                      <Link
                        key={u.id}
                        href={`/${building.slug}/${u.unit_number}`}
                        className="flex px-3 py-2 hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-1/4 font-medium text-blue-600 hover:text-blue-800">
                          {u.unit_number}
                        </div>
                        <div className="w-1/4">{u.floor ?? "—"}</div>
                        <div className="w-2/4">{u.owner_name || "—"}</div>
                      </Link>
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
                    <DocumentsList documents={documents} userDisplayNames={userDisplayNames} />
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

            {/* PROPERTY MANAGEMENT */}
            {activeTab === "property_management" && (
              <>
                <h2 className="font-semibold mb-3">Property Management</h2>
                <PropertyManagementList 
                  propertyManagers={propertyManagers}
                  totalPropertyManagersCount={totalPropertyManagersCount}
                  buildingName={building.name}
                  totalDocumentsCount={totalDocumentsCount}
                  totalEventsCount={totalEventsCount}
                />
              </>
            )}

            {/* CONTRACTORS */}
            {activeTab === "contractors" && (
              <>
                <h2 className="font-semibold mb-3">Contractors</h2>
                <ContractorsList 
                  contractors={mostActiveContractors}
                  totalContractorsCount={totalContractorsCount}
                  buildingName={building.name}
                  totalDocumentsCount={totalDocumentsCount}
                  totalEventsCount={totalEventsCount}
                />
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
                        <div className="w-2/5 min-w-0">Title</div>
                        <div className="w-1/3 min-w-0 pl-14 pr-4 overflow-hidden flex items-center justify-center">Type</div>
                        <div className="flex-1 text-right min-w-0 pl-4">Date</div>
                      </div>

                      <EventsList
                        events={events.slice(0, 5)}
                        userDisplayNames={userDisplayNames}
                        buildingSlug={building.slug}
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
