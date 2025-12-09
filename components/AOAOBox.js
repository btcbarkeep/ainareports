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
        className="border-2 border-gray-200 rounded-lg p-5 mb-6 cursor-pointer hover:border-gray-300 hover:shadow-md transition-all bg-gradient-to-br from-gray-50 to-white"
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
        <div className="text-center">
          <div className="text-xs uppercase tracking-wider text-gray-500 mb-2 font-medium">
            AOAO Organization
          </div>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <div className="font-semibold text-gray-900 text-lg">
              {aoao.organization_name}
            </div>
            {aoao.subscription_tier === "paid" && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                ✓ Certified Partner
              </span>
            )}
          </div>
          <div className="mt-3 text-xs text-gray-500">
            Click to view details →
          </div>
        </div>
      </div>

      {isOpen && (() => {
        const isPaid = aoao.subscription_tier === "paid";
        return (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setIsOpen(false)}
          >
            <div
              className={`bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto ${isPaid ? 'border-2 border-amber-300' : ''}`}
              onClick={(e) => e.stopPropagation()}
            >
              {isPaid && (
                <div className="bg-gradient-to-r from-amber-50 to-amber-100 border-b border-amber-200 px-6 py-3 rounded-t-lg sticky top-0 z-10">
                  <div className="flex items-center justify-center gap-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-amber-500 text-white">
                      ⭐ Aina Certified Partner
                    </span>
                    <span className="text-xs text-amber-700">Verified Organization</span>
                  </div>
                </div>
              )}
              <div className="p-6">
                <div className="flex justify-center items-center mb-6 relative">
                  <div className="text-center">
                    <h2 className="text-xl font-bold text-gray-900 mb-1">AOAO Information</h2>
                    {isPaid && (
                      <p className="text-xs text-gray-600">Trusted association partner</p>
                    )}
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="absolute top-0 right-0 text-gray-400 hover:text-gray-600 text-2xl leading-none"
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4 text-sm">
                  <div className="pb-3 border-b border-gray-100 text-center">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Organization Name</span>
                    <div className="text-gray-900 font-medium text-base">{aoao.organization_name}</div>
                  </div>

                  {address && (
                    <div className="text-center">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Address</span>
                      <div className="text-gray-900">{address}</div>
                    </div>
                  )}

                  {aoao.website && (
                    <div className="text-center">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Website</span>
                      <a
                        href={aoao.website.startsWith('http') ? aoao.website : `https://${aoao.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 font-medium break-all"
                      >
                        {aoao.website}
                      </a>
                    </div>
                  )}

                  {aoao.contact_person && aoao.contact_person !== "string" && (
                    <div className="text-center">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Contact Person</span>
                      <div className="text-gray-900 font-medium">{aoao.contact_person}</div>
                    </div>
                  )}

                  {aoao.contact_phone && aoao.contact_phone !== "string" && (
                    <div className="text-center">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Contact Phone</span>
                      <a
                        href={`tel:${aoao.contact_phone.replace(/\D/g, '')}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {aoao.contact_phone}
                      </a>
                    </div>
                  )}

                  {aoao.contact_email && aoao.contact_email !== "string" && (
                    <div className="text-center">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Contact Email</span>
                      <a
                        href={`mailto:${aoao.contact_email}`}
                        className="text-blue-600 hover:text-blue-800 font-medium break-all"
                      >
                        {aoao.contact_email}
                      </a>
                    </div>
                  )}

                  {aoao.notes && aoao.notes !== "string" && (
                    <div className="text-center">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">About</span>
                      <div className="text-gray-700 whitespace-pre-wrap">{aoao.notes}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}

