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
          <div className="flex-1">
            <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
              AOAO Organization
            </div>
            <div className="flex items-center gap-2">
              <div className="font-semibold text-gray-900">
                {aoao.organization_name}
              </div>
              {aoao.subscription_tier === "paid" && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                  ✓ Certified Partner
                </span>
              )}
            </div>
          </div>
          <div className="text-gray-400">→</div>
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
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-amber-500 text-white">
                      ⭐ Aina Certified Partner
                    </span>
                    <span className="text-xs text-amber-700">Verified Organization</span>
                  </div>
                </div>
              )}
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900 mb-1">AOAO Information</h2>
                    {isPaid && (
                      <p className="text-xs text-gray-600">Trusted association partner</p>
                    )}
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl leading-none ml-4"
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="pb-2 border-b border-gray-100">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Organization Name</span>
                    <div className="mt-1 text-gray-900 font-medium text-base">{aoao.organization_name}</div>
                  </div>

                  {address && (
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Address</span>
                      <div className="text-gray-900">{address}</div>
                    </div>
                  )}

                  {aoao.website && (
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Website</span>
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
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Contact Person</span>
                      <div className="text-gray-900 font-medium">{aoao.contact_person}</div>
                    </div>
                  )}

                  {aoao.contact_phone && aoao.contact_phone !== "string" && (
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Contact Phone</span>
                      <a
                        href={`tel:${aoao.contact_phone.replace(/\D/g, '')}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {aoao.contact_phone}
                      </a>
                    </div>
                  )}

                  {aoao.contact_email && aoao.contact_email !== "string" && (
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Contact Email</span>
                      <a
                        href={`mailto:${aoao.contact_email}`}
                        className="text-blue-600 hover:text-blue-800 font-medium break-all"
                      >
                        {aoao.contact_email}
                      </a>
                    </div>
                  )}

                  {aoao.notes && aoao.notes !== "string" && (
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">About</span>
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

