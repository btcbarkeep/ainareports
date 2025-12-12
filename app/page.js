import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import BuildingsList from "@/components/BuildingsList";
import UnitsList from "@/components/UnitsList";

export default async function Home({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const query = (resolvedSearchParams?.q || "").trim();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL;

  let buildingResults = [];
  let unitResults = [];

  if (query && apiUrl) {
    try {
      // Call the public search API endpoint
      const response = await fetch(
        `${apiUrl}/reports/public/search?query=${encodeURIComponent(query)}`,
        {
          headers: {
            "accept": "application/json",
          },
          next: { revalidate: 60 }, // Cache for 60 seconds
        }
      );

      if (response.ok) {
        const data = await response.json();
        buildingResults = data.buildings || [];
        unitResults = data.units || [];
      } else {
        console.error("Error fetching search results:", response.status);
      }
    } catch (error) {
      console.error("Search error:", error);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center pt-20 px-4">
      {/* LOGO + TITLE */}
      <div className="flex flex-col items-center mb-8 w-full max-w-2xl">
        <Link href="/" className="cursor-pointer mb-4">
          <img
            src="/aina-logo-dark.png"
            alt="Aina Logo"
            width={60}
            height={60}
            className="w-16 h-16 object-contain mx-auto"
          />
        </Link>

        <div className="text-xs tracking-[0.25em] uppercase mb-6 text-center">
          AINAREPORTS
        </div>

        <h1 className="text-3xl md:text-4xl font-semibold text-center mb-2">
          Reliable Condo Reports for Hawaii
        </h1>

        <p className="text-sm md:text-base text-gray-600 mb-6 text-center">
          Powered by{" "}
          <a
            href="https://ainaprotocol.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-900 underline"
          >
            Aina Protocol
          </a>
        </p>

        {/* SEARCH BAR */}
        <div className="w-full flex justify-center mb-4">
          <SearchBar initialQuery={query} />
        </div>

        <div className="flex gap-6 text-sm text-gray-700 mt-4 justify-center">
          <span>Building Reports</span>
          <span>Unit Reports</span>
          <span>AOAO Documents</span>
        </div>
      </div>

      {/* RESULTS BELOW SEARCH BAR */}
      {query && (
        <section className="w-full max-w-3xl mt-4 mb-16">
          <p className="text-xs uppercase tracking-wide text-gray-500 mb-3">
            Search results for:{" "}
            <span className="font-semibold">"{query}"</span>
          </p>

          <div className="space-y-6 text-sm">
            {/* BUILDINGS */}
            <div>
              <h2 className="font-semibold mb-2">Buildings</h2>
              <BuildingsList buildings={buildingResults} />
            </div>

            {/* UNITS */}
            <div>
              <h2 className="font-semibold mb-2">Units</h2>
              <UnitsList units={unitResults} />
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
