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

function calculateMemberSince(createdAt) {
  if (!createdAt) return null;
  
  try {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - created);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months !== 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(diffDays / 365);
      const remainingMonths = Math.floor((diffDays % 365) / 30);
      if (remainingMonths === 0) {
        return `${years} year${years !== 1 ? 's' : ''}`;
      } else {
        return `${years} year${years !== 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
      }
    }
  } catch {
    return null;
  }
}

function formatRole(roles) {
  if (!roles || !Array.isArray(roles) || roles.length === 0) return "—";
  // Capitalize first letter of each role
  return roles.map(role => role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()).join(", ");
}

export default function ContractorsList({ contractors = [] }) {
  const [openContractor, setOpenContractor] = useState(null);

  const onKeyDown = (evt, contractor) => {
    if (evt.key === "Enter" || evt.key === " ") {
      evt.preventDefault();
      setOpenContractor(contractor);
    }
  };

  // Sort contractors: Certified first, then by event count descending
  const sortedContractors = [...contractors].sort((a, b) => {
    const aIsPaid = a.subscription_tier === "paid";
    const bIsPaid = b.subscription_tier === "paid";
    
    // If one is paid and the other isn't, paid comes first
    if (aIsPaid && !bIsPaid) return -1;
    if (!aIsPaid && bIsPaid) return 1;
    
    // Both same certification status, sort by event count descending
    const aCount = a.count || a.event_count || 0;
    const bCount = b.count || b.event_count || 0;
    return bCount - aCount;
  });

  const renderRow = (c, index) => {
    const isPaid = c.subscription_tier === "paid";
    const roles = c.roles || [];
    const roleText = formatRole(roles);
    const licenseNumber = c.license_number && c.license_number !== "string" ? c.license_number : null;
    
    return (
      <div
        key={c.id || `contractor-${index}`}
        className={`flex items-center px-3 py-2 cursor-pointer ${
          isPaid 
            ? 'bg-amber-50 hover:bg-amber-100 border-l-4 border-amber-400' 
            : 'hover:bg-gray-50'
        }`}
        role="button"
        tabIndex={0}
        onClick={() => setOpenContractor(c)}
        onKeyDown={(e) => onKeyDown(e, c)}
      >
        <div className="w-2/5 min-w-0 pr-4">
          <div className="truncate" title={c.company_name || c.name || "Contractor"}>
            {c.company_name || c.name || "Contractor"}
          </div>
        </div>
        <div className="w-1/3 text-xs min-w-0 pl-4 pr-4 overflow-hidden flex items-center">
          <div className="truncate" title={roleText}>
            {roleText}
          </div>
        </div>
        <div className="flex-1 text-xs min-w-0 pl-4 overflow-hidden flex items-center justify-center">
          <div className="truncate" title={c.count !== undefined ? String(c.count) : "—"}>
            {c.count !== undefined ? c.count : "—"}
          </div>
        </div>
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
          className={`bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 ${isPaid ? 'border-2 border-amber-300' : 'border border-gray-200'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {isPaid && (
            <div className="bg-gradient-to-r from-amber-50 to-amber-100 border-b border-amber-200 px-6 py-3 rounded-t-lg">
              <div className="flex items-center justify-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-amber-500 text-white">
                  ⭐ Aina Certified
                </span>
                <span className="text-xs text-amber-700">Verified Professional</span>
              </div>
            </div>
          )}
          <div className="p-6">
            <div className="flex justify-center items-start mb-4 relative">
              <div className="text-center flex-1">
                {openContractor.logo_url && openContractor.logo_url !== "string" && (
                  <div className="mb-3 flex justify-center">
                    <img
                      src={openContractor.logo_url}
                      alt={`${openContractor.company_name || openContractor.name} logo`}
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
                      {openContractor.company_name || openContractor.name || "Contractor"}
                    </h3>
                    <p className="text-xs text-gray-600">Trusted service provider</p>
                  </>
                ) : (
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {openContractor.company_name || openContractor.name || "Contractor"}
                  </h3>
                )}
              </div>
              <button
                onClick={() => setOpenContractor(null)}
                className="absolute top-0 right-0 text-gray-400 hover:text-gray-600 text-2xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                {openContractor.contact_person && (
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Contact Person</span>
                    <div className="text-gray-900 font-medium">{openContractor.contact_person}</div>
                  </div>
                )}
                
                {openContractor.phone && (
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Phone</span>
                    <div className="text-gray-900 font-medium">
                      {isPaid ? (
                        <a href={`tel:${openContractor.phone.replace(/\D/g, '')}`} className="text-blue-600 hover:text-blue-800">
                          {formatPhone(openContractor.phone)}
                        </a>
                      ) : (
                        formatPhone(openContractor.phone)
                      )}
                    </div>
                  </div>
                )}
                
                {openContractor.license_number && openContractor.license_number !== "string" && (
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">License</span>
                    <div className="text-gray-900 font-medium">{openContractor.license_number}</div>
                  </div>
                )}
                
                {openContractor.count !== undefined && (
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Events Completed</span>
                    <div className="text-gray-900 font-medium">{openContractor.count}</div>
                  </div>
                )}
                
                {openContractor.created_at && calculateMemberSince(openContractor.created_at) && (
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Member Since</span>
                    <div className="text-gray-900 font-medium">{calculateMemberSince(openContractor.created_at)}</div>
                  </div>
                )}
              </div>
              
              {isPaid && address && (
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
                      <span key={idx} className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium capitalize">
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {openContractor.insurance_info && openContractor.insurance_info !== "string" && (
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Insurance</span>
                  <div className="text-gray-700">{openContractor.insurance_info}</div>
                </div>
              )}
              
              {openContractor.notes && openContractor.notes !== "string" && (
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">About</span>
                  <div className="text-gray-700">{openContractor.notes}</div>
                </div>
              )}
            </div>
            
            {isPaid && (openContractor.phone || openContractor.email) && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex gap-2">
                  {openContractor.phone && (
                    <a
                      href={`tel:${openContractor.phone.replace(/\D/g, '')}`}
                      className="flex-1 text-center px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-md transition-colors shadow-sm"
                    >
                      📞 {formatPhone(openContractor.phone)}
                    </a>
                  )}
                  {openContractor.email && (
                    <a
                      href={`mailto:${openContractor.email}`}
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

  if (!contractors || contractors.length === 0) {
    return <div className="border rounded-md px-3 py-3 text-gray-500 text-sm">No contractors have posted events yet.</div>;
  }

  return (
    <>
      <div className="border rounded-md divide-y text-sm">
        <div className="flex px-3 py-2 font-semibold text-gray-700">
          <div className="w-2/5">Name</div>
          <div className="w-1/3 pl-4">Role</div>
          <div className="flex-1 pl-4 text-center">Total Events</div>
        </div>
        {sortedContractors.map(renderRow)}
      </div>
      {renderModal()}
    </>
  );
}

