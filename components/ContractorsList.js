"use client";

import { useState } from "react";

function formatPhone(phone) {
  if (!phone) return "—";
  return phone;
}

function formatAddress(contractor) {
  const parts = [
    contractor.address,
    contractor.city,
    contractor.state,
    contractor.zip_code,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

export default function ContractorsList({ contractors = [] }) {
  const [openContractor, setOpenContractor] = useState(null);

  const onKeyDown = (evt, contractor) => {
    if (evt.key === "Enter" || evt.key === " ") {
      evt.preventDefault();
      setOpenContractor(contractor);
    }
  };

  const renderRow = (c, index) => {
    const isPaid = c.subscription_tier === "paid";
    return (
      <div
        key={c.id || `contractor-${index}`}
        className="flex px-3 py-2 hover:bg-gray-50 cursor-pointer"
        role="button"
        tabIndex={0}
        onClick={() => setOpenContractor(c)}
        onKeyDown={(e) => onKeyDown(e, c)}
      >
        <div className="w-2/5">
          <div className="flex items-center gap-2">
            <div className="truncate">{c.company_name || c.name || "Contractor"}</div>
            {isPaid && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200 flex-shrink-0">
                ✓ Certified
              </span>
            )}
          </div>
        </div>
        <div className="w-2/5 text-xs">{formatPhone(c.phone)}</div>
        {c.count !== undefined && (
          <div className="w-1/5 text-right text-xs">{c.count}</div>
        )}
      </div>
    );
  };

  const renderModal = () => {
    if (!openContractor) return null;
    const address = formatAddress(openContractor);
    const isPaid = openContractor.subscription_tier === "paid";
    
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={() => setOpenContractor(null)}
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
                  {openContractor.company_name || openContractor.name || "Contractor"}
                </h3>
                {isPaid && (
                  <p className="text-xs text-gray-600">Trusted service provider</p>
                )}
              </div>
              <button
                onClick={() => setOpenContractor(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none ml-4"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-3 text-sm">
              {openContractor.contact_person && (
                <div className="pb-2 border-b border-gray-100">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact Person</span>
                  <div className="mt-1 text-gray-900 font-medium">{openContractor.contact_person}</div>
                </div>
              )}
              
              <div className="grid grid-cols-1 gap-3">
                {openContractor.phone && (
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Phone</span>
                    <a
                      href={`tel:${openContractor.phone.replace(/\D/g, '')}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {formatPhone(openContractor.phone)}
                    </a>
                  </div>
                )}
                
                {openContractor.email && (
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Email</span>
                    <a
                      href={`mailto:${openContractor.email}`}
                      className="text-blue-600 hover:text-blue-800 font-medium break-all"
                    >
                      {openContractor.email}
                    </a>
                  </div>
                )}
                
                {address && (
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Address</span>
                    <div className="text-gray-900">{address}</div>
                  </div>
                )}
                
                {openContractor.website && openContractor.website !== "string" && (
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Website</span>
                    <a
                      href={openContractor.website.startsWith('http') ? openContractor.website : `https://${openContractor.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-medium break-all"
                    >
                      {openContractor.website}
                    </a>
                  </div>
                )}
                
                {openContractor.roles && Array.isArray(openContractor.roles) && openContractor.roles.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Services</span>
                    <div className="flex flex-wrap gap-1">
                      {openContractor.roles.map((role, idx) => (
                        <span key={idx} className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {openContractor.license_number && openContractor.license_number !== "string" && (
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">License</span>
                    <div className="text-gray-900 font-medium">{openContractor.license_number}</div>
                  </div>
                )}
                
                {openContractor.insurance_info && openContractor.insurance_info !== "string" && (
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Insurance</span>
                    <div className="text-gray-700">{openContractor.insurance_info}</div>
                  </div>
                )}
                
                {openContractor.count !== undefined && (
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Events Completed</span>
                    <div className="text-gray-900 font-medium">{openContractor.count}</div>
                  </div>
                )}
                
                {openContractor.notes && openContractor.notes !== "string" && (
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Notes</span>
                    <div className="text-gray-700">{openContractor.notes}</div>
                  </div>
                )}
              </div>
            </div>
            
            {isPaid && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <a
                  href={`https://www.ainaprotocol.com/contact?contractor=${encodeURIComponent(openContractor.company_name || openContractor.name || '')}`}
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

  if (!contractors || contractors.length === 0) {
    return <div className="border rounded-md px-3 py-3 text-gray-500 text-sm">No contractors have posted events yet.</div>;
  }

  return (
    <>
      <div className="border rounded-md divide-y text-sm">
        <div className="flex px-3 py-2 font-semibold text-gray-700">
          <div className="w-2/5">Name</div>
          <div className="w-2/5">Phone</div>
          {contractors.some(c => c.count !== undefined) && (
            <div className="w-1/5 text-right">Events</div>
          )}
        </div>
        {contractors.map(renderRow)}
      </div>
      {renderModal()}
    </>
  );
}

