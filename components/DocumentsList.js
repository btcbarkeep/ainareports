"use client";

import { useState } from "react";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" });
  } catch {
    return dateStr;
  }
}

function formatCategory(category) {
  if (!category) return "—";
  // Replace underscores with spaces and capitalize each word
  return category
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export default function DocumentsList({ documents = [], userDisplayNames = {} }) {
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

  const renderModal = () => {
    if (!openDoc) return null;
    const downloadLink = buildDownloadLink(openDoc);
    const title = openDoc.title || openDoc.filename || openDoc.document_type || "Document";

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
              <h3 className="text-lg font-semibold">{title}</h3>
              <button
                onClick={() => setOpenDoc(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-sm text-gray-700">
              {openDoc.category && (
                <div>
                  <span className="font-medium">Category:</span>{" "}
                  {formatCategory(openDoc.category)}
                  {openDoc.subcategory && (
                    <span className="text-gray-500"> / {formatCategory(openDoc.subcategory)}</span>
                  )}
                </div>
              )}
              {openDoc.source && (
                <div>
                  <span className="font-medium">Source:</span>{" "}
                  {openDoc.source}
                </div>
              )}
              <div>
                <span className="font-medium">Uploaded:</span>{" "}
                {formatDate(openDoc.created_at)}
              </div>
              <div>
                <span className="font-medium">Uploaded By:</span>{" "}
                {openDoc.uploaded_by_role ? (
                  <span className="capitalize">{openDoc.uploaded_by_role}</span>
                ) : (
                  "—"
                )}
              </div>
              {openDoc.description && (
                <div>
                  <span className="font-medium">Description:</span>
                  <p className="mt-1 whitespace-pre-wrap">
                    {openDoc.description}
                  </p>
                </div>
              )}
              {openDoc.permit_number && (
                <div>
                  <span className="font-medium">Permit Number:</span>{" "}
                  {openDoc.permit_number}
                </div>
              )}
              {openDoc.permit_type && (
                <div>
                  <span className="font-medium">Permit Type:</span>{" "}
                  {openDoc.permit_type}
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

  const renderRow = (doc) => {
    const title = doc.title || doc.filename || doc.document_type || "—";
    const category = formatCategory(doc.category);
    const updatedDate = formatDate(doc.updated_at);
    
    const onKeyDown = (evt) => {
      if (evt.key === "Enter" || evt.key === " ") {
        evt.preventDefault();
        setOpenDoc(doc);
      }
    };

    return (
      <div
        key={doc.id}
        className="flex px-3 py-2 hover:bg-gray-50 cursor-pointer"
        role="button"
        tabIndex={0}
        onClick={() => setOpenDoc(doc)}
        onKeyDown={onKeyDown}
      >
        <div className="w-2/5 min-w-0 pr-4 overflow-hidden">
          <div className="font-medium text-blue-600 truncate" title={title}>
            {title}
          </div>
        </div>
        <div className="w-1/4 min-w-0 pl-8 pr-4 overflow-hidden flex items-center justify-center">
          <div className="truncate" title={category}>
            {category}
          </div>
        </div>
        <div className="flex-1 min-w-0 pl-4 overflow-hidden flex items-center justify-center">
          <div className="truncate" title={updatedDate}>
            {updatedDate}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="border rounded-md divide-y text-sm">
        <div className="flex px-3 py-2 font-semibold text-gray-700">
          <div className="w-2/5 min-w-0">Title</div>
          <div className="w-1/4 min-w-0 pl-8 pr-4 overflow-hidden flex items-center justify-center">Category</div>
          <div className="flex-1 min-w-0 pl-4 overflow-hidden flex items-center justify-center">Date</div>
        </div>
        {documents.map(renderRow)}
      </div>
      {renderModal()}
    </>
  );
}

