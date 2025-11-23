"use client";

import { useState, useEffect } from "react";

export default function EventDocumentModal({ eventId, isOpen, onClose }) {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [documentId, setDocumentId] = useState(null);

  useEffect(() => {
    if (isOpen && eventId) {
      fetchDocumentDetails();
    } else {
      setDocument(null);
      setError(null);
      setDocumentId(null);
    }
  }, [isOpen, eventId]);

  async function fetchDocumentDetails() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/events/${eventId}/document`);
      if (!response.ok) {
        if (response.status === 404) {
          setError("No document found for this event");
        } else {
          setError("Failed to load document details");
        }
        setLoading(false);
        return;
      }
      const data = await response.json();
      setDocument(data);
      
      // Set document ID if available (the API route now looks it up for us)
      if (data.document_id) {
        setDocumentId(data.document_id);
      }
    } catch (err) {
      setError("Failed to load document details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  // Check if there's a document attached (s3_key, download_url, document_url, or document_id)
  const hasDocument = document && (
    document.s3_key || 
    document.download_url || 
    document.document_url || 
    document.document_id
  );

  const documentUrl = document?.download_url || document?.document_url;
  const isValidUrl = documentUrl && 
    typeof documentUrl === 'string' && 
    documentUrl.trim() !== '' &&
    (documentUrl.startsWith('http://') || documentUrl.startsWith('https://'));
  
  // Determine download link
  let downloadLink = null;
  if (hasDocument) {
    if (isValidUrl) {
      downloadLink = documentUrl;
    } else if (documentId || document?.document_id) {
      // Use the document ID (either from lookup or from event)
      const docId = documentId || document.document_id;
      downloadLink = `/api/documents/${docId}/download`;
    } else if (document?.s3_key) {
      // Fallback: try events endpoint (though this may not work)
      downloadLink = `/api/events/${eventId}/download`;
    }
  }

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

          {loading && (
            <div className="text-center py-8 text-gray-500">
              Loading event details...
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-red-500">
              {error}
            </div>
          )}

          {document && !loading && !error && (
            <div className="space-y-6">
              {/* Title */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {document.title || "—"}
                </h3>
              </div>

              {/* Event Type, Unit Number, Occurred At, and Status */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                {document.event_type && (
                  <div>
                    <span className="font-medium">Type:</span> {document.event_type}
                  </div>
                )}
                <div>
                  <span className="font-medium">Unit:</span> {document.unit_number || "Building"}
                </div>
                {document.occurred_at && (
                  <div>
                    <span className="font-medium">Occurred:</span> {formatDate(document.occurred_at)}
                  </div>
                )}
                {document.status && (
                  <div>
                    <span className="font-medium">Status:</span> {document.status}
                  </div>
                )}
              </div>

              {/* Body */}
              {document.body && (
                <div>
                  <div className="text-gray-700 whitespace-pre-wrap">
                    {document.body}
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
          )}
        </div>
      </div>
    </div>
  );
}

