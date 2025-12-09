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
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleEventClick = (event) => {
    // Open modal for all events, regardless of document status
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
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

          const onKeyDown = (evt) => {
            if (evt.key === "Enter" || evt.key === " ") {
              evt.preventDefault();
              handleEventClick(e);
            }
          };

          return (
            <div
              key={e.id}
              className="flex px-3 py-2 hover:bg-gray-50 cursor-pointer"
              role="button"
              tabIndex={0}
              onClick={() => handleEventClick(e)}
              onKeyDown={onKeyDown}
            >
              <div className="w-2/5 min-w-0 pr-4 overflow-hidden">
                <div
                  className="font-medium text-blue-600 truncate"
                  title={eventTitle}
                >
                  {eventTitle}
                </div>
              </div>
              <div className="w-1/4 min-w-0 pl-4 pr-4 overflow-hidden">
                <div className="truncate capitalize" title={e.event_type || "—"}>
                  {e.event_type || "—"}
                </div>
              </div>
              <div className="w-1/5 min-w-0 pl-4 pr-4 overflow-hidden">
                <div className="truncate capitalize" title={e.status || "—"}>
                  {e.status || "—"}
                </div>
              </div>
              <div className="flex-1 text-right min-w-0 pl-4 overflow-hidden">
                <div className="truncate" title={formatDate(e.occurred_at)}>
                  {formatDate(e.occurred_at)}
                </div>
              </div>
            </div>
          );
        })
      )}
      
      <EventDocumentModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </>
  );
}

