import Link from "next/link";
import EventsList from "@/components/EventsList";
import DocumentsList from "@/components/DocumentsList";
import ContractorsList from "@/components/ContractorsList";
import PropertyManagementList from "@/components/PropertyManagementList";
import MostActiveContractorBox from "@/components/MostActiveContractorBox";
import VerifiedBadge from "@/components/VerifiedBadge";
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
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL;

    if (!apiUrl) {
      console.error("API URL not configured");
      return null;
    }

    // Fetch all data from public API endpoint using building_slug and unit_number
    let publicData = null;
    try {
      const apiEndpoint = `${apiUrl}/reports/public/unit/${unitNumber}?building_slug=${buildingSlug}&format=json`;
      
      const response = await fetch(
        apiEndpoint,
        {
          headers: {
            accept: "application/json",
          },
          next: { revalidate: 300 }, // Cache for 5 minutes
        }
      );

      if (response.ok) {
        const result = await response.json();
        publicData = result;
      } else {
        const errorText = await response.text().catch(() => '');
        console.error(`Error fetching unit data from API: ${response.status}`, errorText);
        return null;
      }
    } catch (apiError) {
      console.error("Error calling unit API:", apiError);
      return null;
    }

    if (!publicData) {
      return null;
    }

    // Extract data from API response
    // Handle different possible response structures:
    // 1. { unit: {...}, building: {...}, events: [...], ... }
    // 2. { data: { unit: {...}, building: {...}, ... } }
    // 3. Unit/building data at root level
    let apiUnit = null;
    let apiBuilding = null;
    
    // Check for nested data structure first
    if (publicData.data) {
      apiUnit = publicData.data.unit;
      apiBuilding = publicData.data.building;
      publicData = {
        ...publicData.data,
        unit: apiUnit,
        building: apiBuilding,
      };
    } else if (publicData.unit && publicData.building) {
      // Standard structure: { unit: {...}, building: {...}, events: [...], ... }
      apiUnit = publicData.unit;
      apiBuilding = publicData.building;
    } else if (publicData.id && publicData.unit_number) {
      // The response might be the unit object itself
      apiUnit = publicData;
      // Try to get building from the response
      apiBuilding = publicData.building || null;
      // Extract other data if present, or create structure
      publicData = {
        unit: apiUnit,
        building: apiBuilding,
        units: publicData.units || [],
        events: publicData.events || [],
        documents: publicData.documents || [],
        contractors: publicData.contractors || [],
        property_management_companies: publicData.property_management_companies || [],
      };
    }
    
    const apiEvents = publicData.events || [];
    const apiDocuments = publicData.documents || [];
    const apiContractors = publicData.contractors || [];
    const apiBuildingContractors = publicData.property_management_companies || [];
    const statistics = publicData.statistics || {};
    // Extract most active contractor events
    const mostActiveContractorEvents = publicData.most_active_contractor_events || [];

    if (!apiUnit || !apiBuilding) {
      return null;
    }

    // Create a map of event_id -> document for quick lookup
    const eventDocumentMap = new Map();
    apiDocuments.forEach((doc) => {
      if (doc.event_id) {
        eventDocumentMap.set(doc.event_id, doc);
      }
    });

    // Events: use unit_ids array (for unit page, events should already be filtered to this unit)
    const events = apiEvents.map((e) => {
      // Find associated document if it exists
      const associatedDoc = eventDocumentMap.get(e.id);
      
      // Events have unit_ids array - for unit page, we can just use the unit number
      // But also preserve units_affected if it exists for multi-unit events
      const unitNumbers = e.units_affected ? e.units_affected.split(',').map(u => u.trim()) : [apiUnit.unit_number];
      return {
        ...e,
        unitNumber: apiUnit.unit_number,
        unitNumbers: unitNumbers, // Keep all unit numbers for reference
        units_affected: e.units_affected, // Keep units_affected string for reference
        // Add document_id from associated document if available
        document_id: e.document_id || associatedDoc?.id || null,
      };
    });

    // Documents: use unit_ids array
    const documents = apiDocuments.map((d) => ({
      ...d,
      // Documents have unit_ids array
    }));

    // Map contractors from API response
    const unitContractors = apiContractors.map((c, index) => ({
      id: c.id || `contractor-${index}`,
      name: c.company_name || c.name || "Contractor",
      company_name: c.company_name || c.name || "Contractor",
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
    }));

    const mostActiveContractor = unitContractors.length > 0 ? unitContractors[0] : null;
    const contractorEvents = mostActiveContractorEvents.slice(0, 5); // Limit to 5 events

    // Building contractors (property management companies)
    // The API endpoint already filters to only return PM companies with access to this unit
    const buildingContractors = apiBuildingContractors
      .map((c) => ({
        id: c.id,
        company_name: c.company_name || c.name,
        name: c.company_name || c.name,
        phone: c.contact_phone || c.phone || "",
        address: c.address,
        city: c.city,
        state: c.state,
        zip_code: c.zip_code || c.zip,
        email: c.contact_email || c.email,
        contact_person: c.contact_person,
        website: c.website,
        notes: c.notes,
        unit_count: c.unit_count,
        subscription_tier: c.subscription_tier,
        license_number: c.license_number || c.license,
        logo_url: c.logo_url,
        created_at: c.created_at,
      }));

    // USER DISPLAY NAMES
    const userDisplayNames = {};

    // Calculate totals for unlock section (use statistics if available, otherwise use array lengths)
    const totalContractorsCount = statistics.total_contractors ?? apiContractors.length ?? 0;
    const totalDocumentsCount = statistics.total_documents ?? apiDocuments.length ?? 0;
    const totalEventsCount = statistics.total_events ?? apiEvents.length ?? 0;
    const totalPropertyManagersCount = statistics.total_pm_companies ?? apiBuildingContractors.length ?? 0;

    return {
      building: apiBuilding,
      unit: apiUnit,
      events,
      documents,
      mostActiveContractor,
      buildingContractors,
      unitContractors,
      userDisplayNames,
      totalContractorsCount,
      totalDocumentsCount,
      totalEventsCount,
      totalPropertyManagersCount,
      contractorEvents,
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

function formatZoning(zoning) {
  if (!zoning) return "—";
  
  const firstLetter = zoning.trim().charAt(0).toUpperCase();
  let type = "";
  
  if (firstLetter === "H") {
    type = "Hotel";
  } else if (firstLetter === "A") {
    type = "Apartment";
  } else if (firstLetter === "R") {
    type = "Residential";
  }
  
  return type ? `${zoning} - ${type}` : zoning;
}

// -------------------------------------------------------------
// METADATA
// -------------------------------------------------------------
export async function generateMetadata({ params }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.ainareports.com";
  const { slug, unit: unitNumber } = await params;
  const result = await fetchUnitWithRelations(slug, unitNumber);
  
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
  const { slug, unit: unitNumber } = await params;
  const resolvedSearchParams = await searchParams;
  const activeTab = resolvedSearchParams?.tab || "overview";

  const result = await fetchUnitWithRelations(slug, unitNumber);
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
    unitContractors,
    userDisplayNames,
    totalContractorsCount,
    totalDocumentsCount,
    totalEventsCount,
    totalPropertyManagersCount,
    contractorEvents,
  } = result;

  const addressLine = formatAddress(building);

  // Check if unit has verified owner (owner with paid subscription tier)
  const hasVerifiedOwner = unit.owners && Array.isArray(unit.owners) && 
    unit.owners.some(owner => owner.subscription_tier === "paid");

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
          <div className="mb-1 text-center">
            <h1 className="text-4xl md:text-5xl font-semibold inline-block relative">
              {hasVerifiedOwner && (
                <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2">
                  <VerifiedBadge type="unit" />
                </div>
              )}
              {unit.unit_number}
            </h1>
          </div>

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
              { id: "overview", label: "Overview" },
              { id: "documents", label: "Docs" },
              { id: "events", label: "Events" },
              { id: "property_management", label: "Mgmt" },
              { id: "contractors", label: "Vendors" },
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
            {/* ---------------- OVERVIEW TAB ---------------- */}
            {activeTab === "overview" && (
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
                    <div className="w-1/2">{formatZoning(building.zoning)}</div>
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
                  <DocumentsList documents={documents} userDisplayNames={userDisplayNames} />
                )}
              </>
            )}

            {/* ---------------- EVENTS TAB ---------------- */}
            {activeTab === "events" && (
              <>
                <h2 className="font-semibold mb-3">Events</h2>

                <div className="border rounded-md divide-y text-sm">
                  <div className="flex px-3 py-2 font-semibold text-gray-700">
                    <div className="w-2/5 min-w-0">Title</div>
                    <div className="w-2/5 min-w-0 pl-4 pr-4 overflow-hidden flex items-center justify-center">Type</div>
                    <div className="flex-1 min-w-0 px-4 flex items-center justify-center text-center">Date</div>
                  </div>

                  <EventsList
                    events={events}
                    userDisplayNames={userDisplayNames}
                    buildingSlug={building.slug}
                  />
                </div>
              </>
            )}

            {/* ---------------- PROPERTY MANAGEMENT TAB ---------------- */}
            {activeTab === "property_management" && (
              <>
                <h2 className="font-semibold mb-3">Property Management</h2>
                <PropertyManagementList 
                  propertyManagers={buildingContractors}
                  totalPropertyManagersCount={totalPropertyManagersCount}
                  buildingName={building.name}
                  totalDocumentsCount={totalDocumentsCount}
                  totalEventsCount={totalEventsCount}
                />
              </>
            )}

            {/* ---------------- CONTRACTORS TAB ---------------- */}
            {activeTab === "contractors" && (
              <>
                <h2 className="font-semibold mb-3">Contractors</h2>
                <ContractorsList 
                  contractors={unitContractors}
                  totalContractorsCount={totalContractorsCount}
                  buildingName={building.name}
                  totalDocumentsCount={totalDocumentsCount}
                  totalEventsCount={totalEventsCount}
                />
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

            <MostActiveContractorBox
              contractor={mostActiveContractor}
              events={contractorEvents}
              buildingSlug={building.slug}
            />

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
