"use client";

import Link from "next/link";

export default function EventDocumentModal({ event, isOpen, onClose, buildingSlug }) {
  if (!isOpen || !event) return null;

  // Check if there's a document attached (s3_key, download_url, document_url, or document_id)
  const hasDocument = event && (
    event.s3_key || 
    event.download_url || 
    event.document_url || 
    event.document_id
  );

  const documentUrl = event?.download_url || event?.document_url;
  const isValidUrl = documentUrl && 
    typeof documentUrl === 'string' && 
    documentUrl.trim() !== '' &&
    (documentUrl.startsWith('http://') || documentUrl.startsWith('https://'));
  
  // Determine download link - prioritize document_id over s3_key
  let downloadLink = null;
  if (hasDocument) {
    if (isValidUrl) {
      // Direct URL - use it
      downloadLink = documentUrl;
    } else if (event?.document_id) {
      // Use document_id to download via documents endpoint (most reliable)
      downloadLink = `/api/documents/${event.document_id}/download`;
    } else if (event?.s3_key) {
      // Fallback: try events download endpoint (may not work if backend endpoint doesn't exist)
      downloadLink = `/api/events/${event.id}/download`;
    }
  }

  // Get unit numbers from event data
  const unitNumbers = event.unitNumbers || event.unit_numbers || [];
  const unitsAffected = event.units_affected ? event.units_affected.split(',').map(u => u.trim()) : [];
  const allUnitNumbers = unitNumbers.length > 0 ? unitNumbers : (unitsAffected.length > 0 ? unitsAffected : [event.unitNumber || null].filter(Boolean));
  const hasMultipleUnits = allUnitNumbers.length > 1;

  // Format occurred_at date
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  // Get severity styling
  const severity = event.severity?.toLowerCase() || "";
  const getSeverityBadgeClass = () => {
    if (severity === "high") return "bg-red-100 text-red-800";
    if (severity === "medium") return "bg-amber-100 text-amber-800";
    if (severity === "low") return "bg-green-100 text-green-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Event Details</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="space-y-6">
            {/* Title */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {event.title || "—"}
              </h3>
            </div>

            {/* Event Type, Unit Number, Occurred At, Status, and Severity */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              {event.event_type && (
                <div>
                  <span className="font-medium">Type:</span> <span className="capitalize">{event.event_type}</span>
                </div>
              )}
              {hasMultipleUnits ? (
                <div>
                  <span className="font-medium">Units Effected:</span>{" "}
                  {allUnitNumbers.map((unitNum, idx) => (
                    <span key={idx}>
                      {buildingSlug && unitNum ? (
                        <Link 
                          href={`/${buildingSlug}/${unitNum}`}
                          className="text-blue-600 hover:text-blue-800 underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {unitNum}
                        </Link>
                      ) : (
                        unitNum
                      )}
                      {idx < allUnitNumbers.length - 1 && ", "}
                    </span>
                  ))}
                </div>
              ) : (
                <div>
                  <span className="font-medium">Unit:</span>{" "}
                  {buildingSlug && allUnitNumbers[0] ? (
                    <Link 
                      href={`/${buildingSlug}/${allUnitNumbers[0]}`}
                      className="text-blue-600 hover:text-blue-800 underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {allUnitNumbers[0]}
                    </Link>
                  ) : (
                    (allUnitNumbers[0] || "Building")
                  )}
                </div>
              )}
              {event.occurred_at && (
                <div>
                  <span className="font-medium">Occurred:</span> {formatDate(event.occurred_at)}
                </div>
              )}
              {event.status && (
                <div>
                  <span className="font-medium">Status:</span>{" "}
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${
                    event.status.toLowerCase() === "open" 
                      ? "bg-red-100 text-red-800" 
                      : event.status.toLowerCase() === "resolved"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    {event.status}
                  </span>
                </div>
              )}
              {event.severity && (
                <div>
                  <span className="font-medium">Severity:</span>{" "}
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${getSeverityBadgeClass()}`}>
                    {event.severity}
                  </span>
                </div>
              )}
            </div>

            {/* Body */}
            {event.body && (
              <div>
                <div className="text-gray-700 whitespace-pre-wrap">
                  {event.body}
                </div>
              </div>
            )}

            {/* View Document Button - only if document exists */}
            {hasDocument && downloadLink && (
              <div className="pt-4 border-t">
                <a
                  href={downloadLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  View Document
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

