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

  const renderRow = (c, index) => (
    <div
      key={c.id || `contractor-${index}`}
      className="flex px-3 py-2 hover:bg-gray-50 cursor-pointer"
      role="button"
      tabIndex={0}
      onClick={() => setOpenContractor(c)}
      onKeyDown={(e) => onKeyDown(e, c)}
    >
      <div className="w-2/5">{c.company_name || c.name || "Contractor"}</div>
      <div className="w-2/5 text-xs">{formatPhone(c.phone)}</div>
      {c.count !== undefined && (
        <div className="w-1/5 text-right text-xs">{c.count}</div>
      )}
    </div>
  );

  const renderModal = () => {
    if (!openContractor) return null;
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={() => setOpenContractor(null)}
      >
        <div
          className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {openContractor.company_name || openContractor.name || "Contractor"}
              </h3>
              <button
                onClick={() => setOpenContractor(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="space-y-2 text-sm text-gray-700">
              {openContractor.contact_person && (
                <div>
                  <span className="font-medium">Contact Person:</span>{" "}
                  {openContractor.contact_person}
                </div>
              )}
              {openContractor.phone && (
                <div>
                  <span className="font-medium">Phone:</span>{" "}
                  {formatPhone(openContractor.phone)}
                </div>
              )}
              {openContractor.email && (
                <div>
                  <span className="font-medium">Email:</span>{" "}
                  <a
                    href={`mailto:${openContractor.email}`}
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    {openContractor.email}
                  </a>
                </div>
              )}
              {formatAddress(openContractor) && (
                <div>
                  <span className="font-medium">Address:</span>{" "}
                  {formatAddress(openContractor)}
                </div>
              )}
              {openContractor.website && openContractor.website !== "string" && (
                <div>
                  <span className="font-medium">Website:</span>{" "}
                  <a
                    href={openContractor.website.startsWith('http') ? openContractor.website : `https://${openContractor.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    {openContractor.website}
                  </a>
                </div>
              )}
              {openContractor.license_number && openContractor.license_number !== "string" && (
                <div>
                  <span className="font-medium">License:</span>{" "}
                  {openContractor.license_number}
                </div>
              )}
              {openContractor.insurance_info && openContractor.insurance_info !== "string" && (
                <div>
                  <span className="font-medium">Insurance Info:</span>{" "}
                  {openContractor.insurance_info}
                </div>
              )}
              {openContractor.roles && Array.isArray(openContractor.roles) && openContractor.roles.length > 0 && (
                <div>
                  <span className="font-medium">Roles:</span>{" "}
                  {openContractor.roles.join(", ")}
                </div>
              )}
              {openContractor.notes && openContractor.notes !== "string" && (
                <div>
                  <span className="font-medium">Notes:</span>{" "}
                  {openContractor.notes}
                </div>
              )}
              {openContractor.count !== undefined && (
                <div>
                  <span className="font-medium">Event Count:</span>{" "}
                  {openContractor.count}
                </div>
              )}
            </div>
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

