"use client";

import { useState } from "react";

export default function AOAOBox({ aoao }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!aoao || !aoao.organization_name) {
    return null;
  }

  const formatAddress = () => {
    const parts = [
      aoao.address,
      aoao.city,
      aoao.state,
      aoao.zip_code,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : null;
  };

  const address = formatAddress();

  return (
    <>
      <div
        className="border border-gray-300 rounded-md p-4 mb-6 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
        role="button"
        tabIndex={0}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
              AOAO Organization
            </div>
            <div className="font-semibold text-gray-900">
              {aoao.organization_name}
            </div>
          </div>
          <div className="text-gray-400">→</div>
        </div>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">AOAO Information</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Organization Name:</span>
                  <div className="text-gray-900 mt-1">{aoao.organization_name}</div>
                </div>

                {address && (
                  <div>
                    <span className="font-medium text-gray-700">Address:</span>
                    <div className="text-gray-900 mt-1">{address}</div>
                  </div>
                )}

                {aoao.website && (
                  <div>
                    <span className="font-medium text-gray-700">Website:</span>
                    <div className="mt-1">
                      <a
                        href={aoao.website.startsWith('http') ? aoao.website : `https://${aoao.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        {aoao.website}
                      </a>
                    </div>
                  </div>
                )}

                {aoao.contact_person && aoao.contact_person !== "string" && (
                  <div>
                    <span className="font-medium text-gray-700">Contact Person:</span>
                    <div className="text-gray-900 mt-1">{aoao.contact_person}</div>
                  </div>
                )}

                {aoao.contact_phone && aoao.contact_phone !== "string" && (
                  <div>
                    <span className="font-medium text-gray-700">Contact Phone:</span>
                    <div className="text-gray-900 mt-1">{aoao.contact_phone}</div>
                  </div>
                )}

                {aoao.contact_email && aoao.contact_email !== "string" && (
                  <div>
                    <span className="font-medium text-gray-700">Contact Email:</span>
                    <div className="mt-1">
                      <a
                        href={`mailto:${aoao.contact_email}`}
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        {aoao.contact_email}
                      </a>
                    </div>
                  </div>
                )}

                {aoao.notes && aoao.notes !== "string" && (
                  <div>
                    <span className="font-medium text-gray-700">Notes:</span>
                    <div className="text-gray-900 mt-1 whitespace-pre-wrap">{aoao.notes}</div>
                  </div>
                )}

                {aoao.subscription_tier && (
                  <div>
                    <span className="font-medium text-gray-700">Subscription Tier:</span>
                    <div className="text-gray-900 mt-1 capitalize">{aoao.subscription_tier}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

