"use client";

import { useState } from "react";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString();
  } catch {
    return dateStr;
  }
}

export default function UnitDocuments({ documents = [], userDisplayNames = {} }) {
  const [openDoc, setOpenDoc] = useState(null);

  const buildDownloadLink = (doc) => {
    const documentUrl = doc.download_url || doc.document_url;
    const isValidUrl =
      documentUrl &&
      typeof documentUrl === "string" &&
      documentUrl.trim() !== "" &&
      (documentUrl.startsWith("http://") || documentUrl.startsWith("https://"));

    if (isValidUrl) return documentUrl;
    if (doc.s3_key) return `/api/documents/${doc.id}/download`;
    return null;
  };

  const renderRow = (doc) => {
    const filename = doc.filename || doc.document_type || "—";
    const downloadLink = buildDownloadLink(doc);
    return (
      <div
        key={doc.id}
        className="flex px-3 py-2 cursor-pointer hover:bg-gray-50"
        onClick={() => setOpenDoc(doc)}
      >
        <div className="w-2/5 min-w-0 pr-4 overflow-hidden">
          <div className="font-medium truncate" title={filename}>
            {filename}
          </div>
        </div>
        <div className="w-1/5 text-xs min-w-0 pl-4 pr-4 overflow-hidden">
          <div className="truncate" title={doc.category || "—"}>
            {doc.category || "—"}
          </div>
        </div>
        <div className="w-2/5 text-right text-xs min-w-0 pl-4 overflow-hidden">
          <div
            className="truncate"
            title={
              (doc.uploaded_by && userDisplayNames[doc.uploaded_by]
                ? userDisplayNames[doc.uploaded_by].role
                : "—") +
              " " +
              formatDate(doc.created_at)
            }
          >
            {doc.uploaded_by && userDisplayNames[doc.uploaded_by]
              ? userDisplayNames[doc.uploaded_by].role
              : "—"}
            <span className="ml-2 text-gray-500">{formatDate(doc.created_at)}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderModal = () => {
    if (!openDoc) return null;
    const downloadLink = buildDownloadLink(openDoc);
    const filename = openDoc.filename || openDoc.document_type || "Document";

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={() => setOpenDoc(null)}
      >
        <div
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{filename}</h3>
              <button
                onClick={() => setOpenDoc(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-sm text-gray-700">
              <div>
                <span className="font-medium">Category:</span>{" "}
                {openDoc.category || "—"}
              </div>
              <div>
                <span className="font-medium">Uploaded:</span>{" "}
                {formatDate(openDoc.created_at)}
              </div>
              <div>
                <span className="font-medium">Uploaded By:</span>{" "}
                {openDoc.uploaded_by && userDisplayNames[openDoc.uploaded_by]
                  ? userDisplayNames[openDoc.uploaded_by].role
                  : "—"}
              </div>
              {openDoc.description && (
                <div>
                  <span className="font-medium">Description:</span>
                  <p className="mt-1 whitespace-pre-wrap">
                    {openDoc.description}
                  </p>
                </div>
              )}
            </div>

            {downloadLink && (
              <div className="pt-4 border-t mt-4">
                <a
                  href={downloadLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  View / Download
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="border rounded-md divide-y text-sm">
        <div className="flex px-3 py-2 font-semibold text-gray-700">
          <div className="w-2/5 min-w-0">Name</div>
          <div className="w-1/5 min-w-0 pl-4">Category</div>
          <div className="w-2/5 text-right min-w-0 pl-4">Uploaded By</div>
        </div>
        {documents.map(renderRow)}
      </div>
      {renderModal()}
    </>
  );
}

