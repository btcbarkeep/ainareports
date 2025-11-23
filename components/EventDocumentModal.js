"use client";

import { useState, useEffect } from "react";

export default function EventDocumentModal({ eventId, isOpen, onClose }) {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && eventId) {
      fetchDocumentDetails();
    } else {
      setDocument(null);
      setError(null);
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
    } catch (err) {
      setError("Failed to load document details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  const documentUrl = document?.download_url || document?.document_url;
  const isValidUrl = documentUrl && 
    typeof documentUrl === 'string' && 
    documentUrl.trim() !== '' &&
    (documentUrl.startsWith('http://') || documentUrl.startsWith('https://'));
  
  // If document has s3_key, determine if it's from a document or event
  // If document has a document_id field, it's a real document from the documents table
  // Otherwise, it's event data and we should use the eventId for the download
  let downloadLink = null;
  if (isValidUrl) {
    downloadLink = documentUrl;
  } else if (document?.s3_key) {
    // Check if this is a real document (has document_id) or event data
    // If document_id exists, it means it came from the documents table
    // Otherwise, it's event data and we use the eventId
    if (document.document_id !== undefined && document.document_id !== null) {
      downloadLink = `/api/documents/${document.id}/download`;
    } else {
      // This is event data, use the eventId
      downloadLink = `/api/events/${eventId}/download`;
    }
  }

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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Document Details</h2>
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
              Loading document details...
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-red-500">
              {error}
            </div>
          )}

          {document && !loading && !error && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Filename</label>
                <div className="mt-1">
                  {downloadLink ? (
                    <a
                      href={downloadLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      {document.filename || document.document_type || "—"}
                    </a>
                  ) : (
                    <div className="text-gray-900">
                      {document.filename || document.document_type || "—"}
                    </div>
                  )}
                </div>
              </div>

              {document.category && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Category</label>
                  <div className="mt-1 text-gray-900">{document.category}</div>
                </div>
              )}

              {document.created_at && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Created At</label>
                  <div className="mt-1 text-gray-900">
                    {new Date(document.created_at).toLocaleString()}
                  </div>
                </div>
              )}

              {document.description && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <div className="mt-1 text-gray-900">{document.description}</div>
                </div>
              )}

              {downloadLink && (
                <div className="pt-4 border-t">
                  <a
                    href={downloadLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Download Document
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

