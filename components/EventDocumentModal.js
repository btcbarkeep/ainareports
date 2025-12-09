"use client";

export default function EventDocumentModal({ event, isOpen, onClose }) {
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

  // Get unit number from event data
  const unitNumber = event.unitNumber || event.unit_numbers?.[0] || null;

  // Format occurred_at date
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
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

            {/* Event Type, Unit Number, Occurred At, and Status */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              {event.event_type && (
                <div>
                  <span className="font-medium">Type:</span> <span className="capitalize">{event.event_type}</span>
                </div>
              )}
              <div>
                <span className="font-medium">Unit:</span> {unitNumber || "Building"}
              </div>
              {event.occurred_at && (
                <div>
                  <span className="font-medium">Occurred:</span> {formatDate(event.occurred_at)}
                </div>
              )}
              {event.status && (
                <div>
                  <span className="font-medium">Status:</span> <span className="capitalize">{event.status}</span>
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

