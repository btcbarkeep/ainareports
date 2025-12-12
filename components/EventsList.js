"use client";

import { useState } from "react";
import EventDocumentModal from "./EventDocumentModal";

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" });
}

function getEventTypeIcon(eventType) {
  if (!eventType) return "📋";
  const typeLower = eventType.toLowerCase();
  const iconMap = {
    maintenance: "🔧",
    renovation: "🔨",
    emergency: "🚨",
    violation: "⚠️",
    general: "📋",
    inspection: "🔍",
  };
  return iconMap[typeLower] || "📋";
}

export default function EventsList({ events, userDisplayNames, buildingSlug }) {
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
        <>
          {events.map((e) => {
          const eventTitle = e.title || "—";
          const severity = e.severity?.toLowerCase() || "";
          
          // Determine background color based on severity
          let severityBgClass = "";
          let severityHoverClass = "";
          if (severity === "high") {
            severityBgClass = "bg-red-50";
            severityHoverClass = "hover:bg-red-100";
          } else if (severity === "medium") {
            severityBgClass = "bg-amber-50";
            severityHoverClass = "hover:bg-amber-100";
          } else if (severity === "low") {
            severityBgClass = "bg-green-50";
            severityHoverClass = "hover:bg-green-100";
          } else {
            severityBgClass = "";
            severityHoverClass = "hover:bg-gray-50";
          }

          const onKeyDown = (evt) => {
            if (evt.key === "Enter" || evt.key === " ") {
              evt.preventDefault();
              handleEventClick(e);
            }
          };

          return (
            <div
              key={e.id}
              className={`flex px-3 py-2 cursor-pointer ${severityBgClass} ${severityHoverClass}`}
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
              <div className="w-2/5 min-w-0 px-4 overflow-hidden flex items-center justify-center gap-1.5">
                <span className="flex-shrink-0">{getEventTypeIcon(e.event_type)}</span>
                <div className="truncate capitalize text-center" title={e.event_type || "—"}>
                  {e.event_type || "—"}
                </div>
              </div>
              <div className="flex-1 min-w-0 px-4 overflow-hidden flex items-center justify-center">
                <div className="w-full text-center" title={formatDate(e.occurred_at)}>
                  {formatDate(e.occurred_at)}
                </div>
              </div>
            </div>
          );
          })}
          <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-200">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 bg-red-50 border border-red-200 rounded"></div>
                <span>High Severity</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 bg-amber-50 border border-amber-200 rounded"></div>
                <span>Medium Severity</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 bg-green-50 border border-green-200 rounded"></div>
                <span>Low Severity</span>
              </div>
            </div>
          </div>
        </>
      )}
      
      <EventDocumentModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={closeModal}
        buildingSlug={buildingSlug}
      />
    </>
  );
}

