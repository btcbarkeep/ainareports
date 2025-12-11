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

function getCategoryIcon(category) {
  if (!category) return "📋";
  const categoryLower = category.toLowerCase();
  const iconMap = {
    unit_level: "🏠",
    legal: "⚖️",
    insurance: "🛡️",
    other: "📋",
    governance: "📜",
    maintenance: "🔧",
    financial: "💰",
    media: "📷",
    safety: "⚠️",
    projects: "🏗️",
    public_documents: "📄",
  };
  return iconMap[categoryLower] || "📋";
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
            <div className="flex justify-between items-center mb-6">
              <div className="flex-1"></div>
              <h3 className="text-lg font-semibold text-center flex-1">{title}</h3>
              <div className="flex-1 flex justify-end">
                <button
                  onClick={() => setOpenDoc(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="space-y-4 text-sm text-gray-700">
              {openDoc.category && (
                <div className="text-center">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Category</div>
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-lg">{getCategoryIcon(openDoc.category)}</span>
                    <span className="font-medium">{formatCategory(openDoc.category)}</span>
                    {openDoc.subcategory && (
                      <span className="text-gray-500"> / {formatCategory(openDoc.subcategory)}</span>
                    )}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                {openDoc.source && (
                  <div className="text-center">
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Source</div>
                    <div className="font-medium">{openDoc.source}</div>
                  </div>
                )}
                <div className="text-center">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Uploaded</div>
                  <div className="font-medium">{formatDate(openDoc.created_at)}</div>
                </div>
              </div>

              {openDoc.uploaded_by_role && (
                <div className="text-center pt-2">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Uploaded By</div>
                  <div className="font-medium capitalize">{openDoc.uploaded_by_role}</div>
                </div>
              )}

              {openDoc.description && (
                <div className="pt-2">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-2 text-center">Description</div>
                  <p className="text-center whitespace-pre-wrap text-gray-600 leading-relaxed">
                    {openDoc.description}
                  </p>
                </div>
              )}

              {(openDoc.permit_number || openDoc.permit_type) && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  {openDoc.permit_number && (
                    <div className="text-center">
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Permit Number</div>
                      <div className="font-medium">{openDoc.permit_number}</div>
                    </div>
                  )}
                  {openDoc.permit_type && (
                    <div className="text-center">
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Permit Type</div>
                      <div className="font-medium">{openDoc.permit_type}</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {downloadLink && (
              <div className="pt-6 mt-6 border-t">
                <a
                  href={downloadLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block w-full text-center px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
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
        <div className="w-2/5 min-w-0 pl-4 pr-4 overflow-hidden flex items-center justify-center">
          <div className="truncate flex items-center gap-1.5" title={category}>
            <span>{getCategoryIcon(doc.category)}</span>
            <span>{category}</span>
          </div>
        </div>
        <div className="flex-1 text-right min-w-0 pl-4 overflow-hidden">
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
          <div className="w-2/5 min-w-0 pl-4 pr-4 overflow-hidden flex items-center justify-center">Category</div>
          <div className="flex-1 text-right min-w-0 pl-4">Date</div>
        </div>
        {documents.map(renderRow)}
      </div>
      {renderModal()}
    </>
  );
}

