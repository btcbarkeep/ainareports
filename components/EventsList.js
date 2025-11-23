"use client";

import { useState } from "react";
import EventDocumentModal from "./EventDocumentModal";

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" });
}

export default function EventsList({ events, userDisplayNames }) {
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleEventClick = (event) => {
    // Open modal for all events, regardless of document status
    setSelectedEventId(event.id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEventId(null);
  };

  return (
    <>
      {(!events || events.length === 0) ? (
        <div className="px-3 py-3 text-gray-500">
          No events recorded yet.
        </div>
      ) : (
        events.map((e) => {
        const eventTitle = e.title || "—";
        
        return (
          <div key={e.id} className="flex px-3 py-2">
            <div className="w-2/5 min-w-0 pr-4 overflow-hidden">
              <button
                onClick={() => handleEventClick(e)}
                className="font-medium underline hover:text-gray-600 cursor-pointer text-blue-600 truncate block text-left"
                title={eventTitle}
              >
                {eventTitle}
              </button>
            </div>
            <div className="w-1/5 min-w-0 pl-4 pr-4 overflow-hidden">
              <div className="truncate" title={e.severity || "—"}>
                {e.severity || "—"}
              </div>
            </div>
            <div className="w-1/5 min-w-0 pl-4 pr-4 overflow-hidden">
              <div className="truncate" title={userDisplayNames[e.created_by]?.role || "—"}>
                {userDisplayNames[e.created_by]?.role || "—"}
              </div>
            </div>
            <div className="w-1/5 text-right min-w-0 pl-4 overflow-hidden">
              <div className="truncate" title={formatDate(e.occurred_at)}>
                {formatDate(e.occurred_at)}
              </div>
            </div>
          </div>
        );
        })
      )}
      
      <EventDocumentModal
        eventId={selectedEventId}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </>
  );
}

