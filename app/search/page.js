import UnitsList from "./UnitsList";

export async function generateMetadata({ searchParams }) {
  const q = searchParams?.q?.trim() || "";
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
  const q = searchParams.q?.trim() || "";

  if (!q || q.length < 2) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-xl font-semibold mb-2">Search</h1>
        <p className="text-gray-500">Enter at least 2 characters.</p>
      </main>
    );
  }

  // Build absolute URL for server-side fetch
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (typeof window === "undefined"
      ? "http://localhost:3000"
      : window.location.origin);

  const res = await fetch(
    `${baseUrl}/api/search?q=${encodeURIComponent(q)}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-xl font-semibold mb-2">Search</h1>
        <p className="text-red-500">Error loading search results. Please try again.</p>
      </main>
    );
  }

  const { buildings, units } = await res.json();

  // Filter out units missing the building relationship
  const safeUnits = (units || []).filter((u) => u.building);

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-6">Search Results</h1>

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
