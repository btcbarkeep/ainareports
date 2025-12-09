"use client";

import { useState } from "react";

function formatPhone(phone) {
  if (!phone) return "—";
  return phone;
}

function formatAddress(pm) {
  const parts = [
    pm.address,
    pm.city,
    pm.state,
    pm.zip_code,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

export default function PropertyManagementList({ propertyManagers = [] }) {
  const [openPM, setOpenPM] = useState(null);

  const onKeyDown = (evt, pm) => {
    if (evt.key === "Enter" || evt.key === " ") {
      evt.preventDefault();
      setOpenPM(pm);
    }
  };

  const renderRow = (pm, index) => {
    const isPaid = pm.subscription_tier === "paid";
    return (
      <div
        key={pm.id || `pm-${index}`}
        className="flex px-3 py-2 hover:bg-gray-50 cursor-pointer"
        role="button"
        tabIndex={0}
        onClick={() => setOpenPM(pm)}
        onKeyDown={(e) => onKeyDown(e, pm)}
      >
        <div className="w-2/5 min-w-0 pr-4 overflow-hidden">
          <div className="flex items-center gap-2">
            <div className="font-medium truncate" title={pm.company_name || pm.name || "Property Manager"}>
              {pm.company_name || pm.name || "Property Manager"}
            </div>
            {isPaid && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200 flex-shrink-0">
                ✓ Certified
              </span>
            )}
          </div>
        </div>
        <div className="w-2/5 text-xs min-w-0 pl-4 pr-4 overflow-hidden">
          <div className="truncate" title={formatPhone(pm.phone)}>
            {formatPhone(pm.phone)}
          </div>
        </div>
        <div className="w-1/5 text-right text-xs min-w-0 pl-4 overflow-hidden">
          {pm.unit_count !== undefined && (
            <div className="truncate" title={pm.unit_count?.toString() || "0"}>
              {pm.unit_count || 0}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderModal = () => {
    if (!openPM) return null;
    const address = formatAddress(openPM);
    const isPaid = openPM.subscription_tier === "paid";
    
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={() => setOpenPM(null)}
      >
        <div
          className={`bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 ${isPaid ? 'border-2 border-amber-300' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          {isPaid && (
            <div className="bg-gradient-to-r from-amber-50 to-amber-100 border-b border-amber-200 px-6 py-3 rounded-t-lg">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-amber-500 text-white">
                  ⭐ Aina Certified
                </span>
                <span className="text-xs text-amber-700">Verified Professional</span>
              </div>
            </div>
          )}
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {openPM.company_name || openPM.name || "Property Manager"}
                </h3>
                {isPaid && (
                  <p className="text-xs text-gray-600">Trusted property management partner</p>
                )}
              </div>
              <button
                onClick={() => setOpenPM(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none ml-4"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-3 text-sm">
              {openPM.contact_person && (
                <div className="pb-2 border-b border-gray-100">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact Person</span>
                  <div className="mt-1 text-gray-900 font-medium">{openPM.contact_person}</div>
                </div>
              )}
              
              <div className="grid grid-cols-1 gap-3">
                {openPM.phone && (
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Phone</span>
                    <a
                      href={`tel:${openPM.phone.replace(/\D/g, '')}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {formatPhone(openPM.phone)}
                    </a>
                  </div>
                )}
                
                {openPM.email && (
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Email</span>
                    <a
                      href={`mailto:${openPM.email}`}
                      className="text-blue-600 hover:text-blue-800 font-medium break-all"
                    >
                      {openPM.email}
                    </a>
                  </div>
                )}
                
                {address && (
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Address</span>
                    <div className="text-gray-900">{address}</div>
                  </div>
                )}
                
                {openPM.website && openPM.website !== "string" && (
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Website</span>
                    <a
                      href={openPM.website.startsWith('http') ? openPM.website : `https://${openPM.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-medium break-all"
                    >
                      {openPM.website}
                    </a>
                  </div>
                )}
                
                {openPM.unit_count !== undefined && (
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Units Managed</span>
                    <div className="text-gray-900 font-medium">{openPM.unit_count}</div>
                  </div>
                )}
                
                {openPM.notes && openPM.notes !== "string" && (
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Notes</span>
                    <div className="text-gray-700">{openPM.notes}</div>
                  </div>
                )}
              </div>
            </div>
            
            {isPaid && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <a
                  href={`https://www.ainaprotocol.com/contact?pm=${encodeURIComponent(openPM.company_name || openPM.name || '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-md transition-colors shadow-sm"
                >
                  Contact This Professional
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!propertyManagers || propertyManagers.length === 0) {
    return (
      <div className="border rounded-md px-3 py-3 text-gray-500 text-sm">
        No property management companies found.
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-md divide-y text-sm">
        <div className="flex px-3 py-2 font-semibold text-gray-700">
          <div className="w-2/5">Name</div>
          <div className="w-2/5">Phone</div>
          {propertyManagers.some(pm => pm.unit_count !== undefined) && (
            <div className="w-1/5 text-right">Units</div>
          )}
        </div>
        {propertyManagers.map(renderRow)}
      </div>
      {renderModal()}
    </>
  );
}

