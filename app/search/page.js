import UnitsList from "./UnitsList";
import SearchBar from "@/components/SearchBar";

export async function generateMetadata({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const q = resolvedSearchParams?.q?.trim() || "";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.ainareports.com";
  
  if (q) {
    return {
      title: `Search Results for "${q}" | AinaReports`,
      description: `Search results for "${q}" on AinaReports. Find building reports, unit reports, and AOAO documents for Hawaii condos.`,
      openGraph: {
        title: `Search Results for "${q}" | AinaReports`,
        description: `Search results for "${q}" on AinaReports. Find building reports, unit reports, and AOAO documents for Hawaii condos.`,
        url: `${siteUrl}/search?q=${encodeURIComponent(q)}`,
        siteName: "AinaReports",
        type: "website",
      },
      robots: {
        index: false, // Don't index search result pages
        follow: true,
      },
    };
  }
  
  return {
    title: "Search | AinaReports",
    description: "Search for building reports, unit reports, and AOAO documents on AinaReports.",
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function SearchResultsPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const q = resolvedSearchParams?.q?.trim() || "";

  if (!q || q.length < 2) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-xl font-semibold mb-2">Search</h1>
        <p className="text-gray-500">Enter at least 2 characters.</p>
      </main>
    );
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL;

  if (!apiUrl) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-xl font-semibold mb-2">Search</h1>
        <p className="text-red-500">API URL not configured.</p>
      </main>
    );
  }

  // Call the public search API endpoint directly
  const res = await fetch(
    `${apiUrl}/reports/public/search?query=${encodeURIComponent(q)}`,
    {
      headers: {
        "accept": "application/json",
      },
      next: { revalidate: 60 }, // Cache for 60 seconds
    }
  );

  if (!res.ok) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-xl font-semibold mb-2">Search</h1>
        <p className="text-red-500">Error loading search results. Please try again.</p>
      </main>
    );
  }

  const data = await res.json();
  const buildings = data.buildings || [];
  const units = data.units || [];

  // Filter out units missing the building relationship
  const safeUnits = (units || []).filter((u) => u.building);

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-6">Search Results</h1>

      {/* SEARCH BAR */}
      <div className="mb-6">
        <SearchBar initialQuery={q} />
      </div>

      <p className="uppercase text-xs tracking-wide text-gray-500 mb-4">
        Results for: <span className="font-bold">"{q.toUpperCase()}"</span>
      </p>

      {/* BUILDINGS */}
      <h2 className="text-lg font-semibold mb-3">Buildings</h2>
      {buildings.length === 0 && (
        <p className="text-gray-500 mb-8">No buildings found.</p>
      )}

      {buildings.map((b) => (
        <a
          key={b.id}
          href={`/${b.slug}`}
          className="block border rounded-md px-4 py-3 mb-3 hover:bg-gray-50"
        >
          <div className="text-base font-medium">{b.name}</div>
          <div className="text-sm text-gray-600">
            {b.address}, {b.city}, {b.state} {b.zip}
          </div>
        </a>
      ))}

      {/* UNITS */}
      <h2 className="text-lg font-semibold mt-10 mb-3">Units</h2>

      {safeUnits.length === 0 ? (
        <p className="text-gray-500">No units found.</p>
      ) : (
        <UnitsList units={safeUnits} />
      )}
    </main>
  );
}
