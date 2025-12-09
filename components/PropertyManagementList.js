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

  const renderRow = (pm, index) => (
    <div
      key={pm.id || `pm-${index}`}
      className="flex px-3 py-2 hover:bg-gray-50 cursor-pointer"
      role="button"
      tabIndex={0}
      onClick={() => setOpenPM(pm)}
      onKeyDown={(e) => onKeyDown(e, pm)}
    >
      <div className="w-2/5 min-w-0 pr-4 overflow-hidden">
        <div className="font-medium truncate" title={pm.company_name || pm.name || "Property Manager"}>
          {pm.company_name || pm.name || "Property Manager"}
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

  const renderModal = () => {
    if (!openPM) return null;
    const address = formatAddress(openPM);
    
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={() => setOpenPM(null)}
      >
        <div
          className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {openPM.company_name || openPM.name || "Property Manager"}
              </h3>
              <button
                onClick={() => setOpenPM(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="space-y-2 text-sm text-gray-700">
              {openPM.phone && (
                <div>
                  <span className="font-medium">Phone:</span>{" "}
                  {formatPhone(openPM.phone)}
                </div>
              )}
              {address && (
                <div>
                  <span className="font-medium">Address:</span>{" "}
                  {address}
                </div>
              )}
              {openPM.email && (
                <div>
                  <span className="font-medium">Email:</span>{" "}
                  <a
                    href={`mailto:${openPM.email}`}
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    {openPM.email}
                  </a>
                </div>
              )}
              {openPM.website && (
                <div>
                  <span className="font-medium">Website:</span>{" "}
                  <a
                    href={openPM.website.startsWith('http') ? openPM.website : `https://${openPM.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    {openPM.website}
                  </a>
                </div>
              )}
              {openPM.unit_count !== undefined && (
                <div>
                  <span className="font-medium">Units Managed:</span>{" "}
                  {openPM.unit_count}
                </div>
              )}
            </div>
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

