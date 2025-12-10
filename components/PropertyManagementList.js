"use client";

import { useState } from "react";
import PremiumUnlockSection from "./PremiumUnlockSection";

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

export default function PropertyManagementList({ 
  propertyManagers = [],
  totalPropertyManagersCount = 0,
  buildingName = "",
  totalDocumentsCount = 0,
  totalEventsCount = 0,
}) {
  const [openPM, setOpenPM] = useState(null);

  const onKeyDown = (evt, pm) => {
    if (evt.key === "Enter" || evt.key === " ") {
      evt.preventDefault();
      setOpenPM(pm);
    }
  };

  // Sort property managers: Paid first, then by unit count descending
  const sortedPMs = [...propertyManagers].sort((a, b) => {
    const aIsPaid = a.subscription_tier === "paid";
    const bIsPaid = b.subscription_tier === "paid";
    
    // If one is paid and the other isn't, paid comes first
    if (aIsPaid && !bIsPaid) return -1;
    if (!aIsPaid && bIsPaid) return 1;
    
    // Both same certification status, sort by unit count descending
    const aCount = a.unit_count || 0;
    const bCount = b.unit_count || 0;
    return bCount - aCount;
  });

  // Limit to 5 property managers for display
  const displayedPMs = sortedPMs.slice(0, 5);
  const hasMorePMs = totalPropertyManagersCount > 5 || sortedPMs.length > 5;

  const renderRow = (pm, index) => {
    const isPaid = pm.subscription_tier === "paid";
    return (
      <div
        key={pm.id || `pm-${index}`}
        className={`flex items-center px-3 py-2 cursor-pointer relative group ${
          isPaid 
            ? 'font-bold hover:bg-amber-50' 
            : 'hover:bg-gray-50'
        }`}
        role="button"
        tabIndex={0}
        onClick={() => setOpenPM(pm)}
        onKeyDown={(e) => onKeyDown(e, pm)}
      >
        {isPaid && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10 border border-gray-200">
            <div className="flex items-center gap-1.5">
              <span className="text-amber-500 text-[10px]">⭐</span>
              <span>Premium Property Manager — Verified by Aina Protocol</span>
            </div>
          </div>
        )}
        <div className="w-2/5 min-w-0 pr-4 relative flex-shrink-0">
          {isPaid && (
            <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 text-amber-500 text-[10px] leading-none">⭐</span>
          )}
          <div className={`truncate overflow-hidden ${isPaid ? 'pl-3' : ''}`} title={pm.company_name || pm.name || "Property Manager"}>
            {pm.company_name || pm.name || "Property Manager"}
          </div>
        </div>
        <div className="w-2/5 text-xs min-w-0 pl-4 pr-4 overflow-hidden flex items-center justify-center flex-shrink-0">
          <div className="truncate overflow-hidden" title={pm.license_number && pm.license_number !== "string" ? pm.license_number : "—"}>
            {pm.license_number && pm.license_number !== "string" ? pm.license_number : "—"}
          </div>
        </div>
        <div className="w-1/5 text-xs min-w-0 pl-4 pr-4 overflow-hidden flex items-center justify-center flex-shrink-0">
          {pm.unit_count !== undefined && (
            <div className="truncate overflow-hidden" title={pm.unit_count?.toString() || "0"}>
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
          className={`bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 ${isPaid ? 'border-2 border-amber-300' : 'border border-gray-200'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {isPaid && (
            <div className="bg-gray-100 border-b border-gray-200 px-6 py-3 rounded-t-lg">
              <div className="flex items-center justify-center gap-1.5 text-sm text-gray-700">
                <span className="text-amber-500 text-[10px]">⭐</span>
                <span>Premium Property Manager — Verified by Aina Protocol</span>
              </div>
            </div>
          )}
          <div className="p-6">
            <div className="flex justify-center items-start mb-4 relative">
              <div className="text-center flex-1">
                {openPM.logo_url && openPM.logo_url !== "string" && (
                  <div className="mb-3 flex justify-center">
                    <img
                      src={openPM.logo_url}
                      alt={`${openPM.company_name || openPM.name} logo`}
                      className="h-16 w-auto object-contain max-w-full"
                      loading="eager"
                      fetchPriority="high"
                      decoding="async"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                {isPaid ? (
                  <>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {openPM.company_name || openPM.name || "Property Manager"}
                    </h3>
                    <p className="text-xs text-gray-600">Trusted property management partner</p>
                  </>
                ) : (
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {openPM.company_name || openPM.name || "Property Manager"}
                  </h3>
                )}
              </div>
              <button
                onClick={() => setOpenPM(null)}
                className="absolute top-0 right-0 text-gray-400 hover:text-gray-600 text-2xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                {openPM.contact_person && (
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Contact Person</span>
                    <div className="text-gray-900 font-medium">{openPM.contact_person}</div>
                  </div>
                )}
                
                {openPM.phone && (
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Phone</span>
                    <div className="text-gray-900 font-medium">
                      {isPaid ? (
                        <a href={`tel:${openPM.phone.replace(/\D/g, '')}`} className="text-blue-600 hover:text-blue-800">
                          {formatPhone(openPM.phone)}
                        </a>
                      ) : (
                        formatPhone(openPM.phone)
                      )}
                    </div>
                  </div>
                )}
                
                {openPM.license_number && openPM.license_number !== "string" && (
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">License</span>
                    <div className="text-gray-900 font-medium">{openPM.license_number}</div>
                  </div>
                )}
                
                {openPM.unit_count !== undefined && (
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Units Managed</span>
                    <div className="text-gray-900 font-medium">{openPM.unit_count}</div>
                  </div>
                )}
              </div>
              
              {isPaid && address && (
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Address</span>
                  <div className="text-gray-900">{address}</div>
                </div>
              )}
              
              {isPaid && openPM.website && openPM.website !== "string" && (
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
              
              {isPaid && openPM.notes && openPM.notes !== "string" && (
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">About</span>
                  <div className="text-gray-700">{openPM.notes}</div>
                </div>
              )}
            </div>
            
            {isPaid && (openPM.phone || openPM.email) && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex gap-2">
                  {openPM.phone && (
                    <a
                      href={`tel:${openPM.phone.replace(/\D/g, '')}`}
                      className="flex-1 text-center px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-md transition-colors shadow-sm"
                    >
                      📞 {formatPhone(openPM.phone)}
                    </a>
                  )}
                  {openPM.email && (
                    <a
                      href={`mailto:${openPM.email}`}
                      className="flex-1 text-center px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-md transition-colors shadow-sm"
                    >
                      ✉️ Email
                    </a>
                  )}
                </div>
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
          <div className="w-2/5 flex items-center justify-center">License</div>
          {propertyManagers.some(pm => pm.unit_count !== undefined) && (
            <div className="w-1/5 flex items-center justify-center">Units</div>
          )}
        </div>
        {displayedPMs.map(renderRow)}
        <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-200">
          <div className="flex items-center gap-1.5">
            <span className="text-amber-500 text-[10px]">⭐</span>
            <span>Premium Property Manager — Verified by Aina Protocol</span>
          </div>
        </div>
      </div>
      {hasMorePMs && (
        <>
          <p className="text-gray-600 text-sm mt-3">
            Showing 5 of {totalPropertyManagersCount || sortedPMs.length} property managers
          </p>
          <PremiumUnlockSection 
            itemType="Property Managers" 
            buildingName={buildingName}
            totalDocumentsCount={totalDocumentsCount}
            totalEventsCount={totalEventsCount}
            totalContractorsCount={0}
          />
        </>
      )}
      {renderModal()}
    </>
  );
}
