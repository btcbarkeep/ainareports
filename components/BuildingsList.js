import Link from "next/link";

export default function BuildingsList({ buildings }) {
  if (buildings.length === 0) {
    return <p className="text-gray-500">No buildings found.</p>;
  }

  return (
    <ul className="border border-gray-200 rounded-md divide-y">
      {buildings.map((b) => (
        <li key={b.id}>
          <Link
            href={`/${b.slug}`}
            className="block px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-1 hover:bg-gray-50 transition-colors"
          >
            <div>
              <div className="font-medium">{b.name}</div>
              <div className="text-gray-500">
                {[b.address, b.city, b.state, b.zip]
                  .filter(Boolean)
                  .join(", ")}
              </div>
            </div>

            <div className="text-xs md:text-sm text-blue-600 underline underline-offset-2">
              View Building Report
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

