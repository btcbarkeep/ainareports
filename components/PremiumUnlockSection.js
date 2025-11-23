export default function PremiumUnlockSection({ 
  itemType, 
  buildingName,
  totalDocumentsCount = 0,
  totalEventsCount = 0,
  totalContractorsCount = 0,
}) {
  const itemTypeLower = itemType.toLowerCase();
  
  const unlockItems = {
    documents: [
      `All documents (${totalDocumentsCount} total)`,
      "All events",
      "Contractor history",
    ],
    events: [
      "All events",
      "All documents",
      "Contractor history",
    ],
    contractors: [
      "All contractors",
      "All documents",
      "All events",
    ],
  };

  const items = unlockItems[itemTypeLower] || unlockItems.documents;

  return (
    <div className="mt-6 border rounded-md p-4 bg-gray-50 text-sm">
      <div className="flex items-start gap-3 mb-2">
        <div className="relative flex-shrink-0">
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <svg
            className="w-3 h-3 text-gray-600 absolute -bottom-0.5 -right-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h3 className="font-semibold text-gray-900">
          Additional {itemTypeLower} hidden
        </h3>
      </div>
      <p className="text-gray-700 mb-2">
        Download the full building report to unlock:
      </p>
      <ul className="list-disc list-inside text-gray-600 space-y-1">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

