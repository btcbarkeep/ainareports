"use client";

import { useState } from "react";
import VerifiedBadgeInline from "./VerifiedBadgeInline";

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

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function getSeverityBadgeClass(severity) {
  const severityLower = severity?.toLowerCase() || "";
  if (severityLower === "high") return "bg-red-100 text-red-800";
  if (severityLower === "medium") return "bg-amber-100 text-amber-800";
  if (severityLower === "low") return "bg-green-100 text-green-800";
  return "bg-gray-100 text-gray-800";
}

export default function ContractorEventsModal({ contractor, events = [], isOpen, onClose, buildingSlug }) {
  const [expandedEvents, setExpandedEvents] = useState(new Set());

  if (!isOpen || !contractor) return null;

  const isPaid = contractor?.subscription_tier === "paid";

  const toggleEvent = (eventId) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex-1"></div>
            <div className="flex-1 text-center">
              <div className="flex items-center justify-center gap-2">
                {isPaid && (
                  <VerifiedBadgeInline />
                )}
                <h3 className="text-lg font-semibold whitespace-nowrap">{contractor.name}</h3>
              </div>
              <p className="text-sm text-gray-500">
                {events.length} recent event{events.length !== 1 ? "s" : ""}
              </p>
              {(contractor.phone || contractor.license_number) && (
                <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                  {contractor.phone && (
                    <div className="text-sm text-gray-700">
                      <span className="font-medium whitespace-nowrap block sm:inline">Phone:</span> <span className="whitespace-nowrap">{contractor.phone}</span>
                    </div>
                  )}
                  {contractor.license_number && (
                    <div className="text-sm text-gray-700">
                      <span className="font-medium whitespace-nowrap block sm:inline">License:</span> <span className="whitespace-nowrap">{contractor.license_number}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex-1 flex justify-end">
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>
          </div>

          <div className="border rounded-md divide-y text-sm">
            <div className="flex px-3 py-2 font-semibold text-gray-700 bg-gray-50">
              <div className="w-2/5 min-w-0">Title</div>
              <div className="w-2/5 min-w-0 pl-4 pr-4 overflow-hidden">Type</div>
              <div className="flex-1 text-right min-w-0 pl-4">Date</div>
            </div>

            {events.length === 0 ? (
              <div className="px-3 py-3 text-gray-500">
                No events recorded yet.
              </div>
            ) : (
              events.map((event) => {
                const eventTitle = event.title || "—";
                const severity = event.severity?.toLowerCase() || "";
                const isExpanded = expandedEvents.has(event.id);

                // Determine background color based on severity
                let severityBgClass = "";
                if (severity === "high") {
                  severityBgClass = "bg-red-50";
                } else if (severity === "medium") {
                  severityBgClass = "bg-amber-50";
                } else if (severity === "low") {
                  severityBgClass = "bg-green-50";
                }

                return (
                  <div key={event.id} className={severityBgClass}>
                    <div
                      className="flex px-3 py-2 cursor-pointer hover:opacity-80"
                      onClick={() => toggleEvent(event.id)}
                    >
                      <div className="w-2/5 min-w-0 pr-4 overflow-hidden">
                        <div className="font-medium text-blue-600 truncate" title={eventTitle}>
                          {eventTitle}
                        </div>
                      </div>
                      <div className="w-2/5 min-w-0 pl-4 pr-4 overflow-hidden flex items-center gap-1.5">
                        <span className="flex-shrink-0">{getEventTypeIcon(event.event_type)}</span>
                        <div className="truncate capitalize" title={event.event_type || "—"}>
                          {event.event_type || "—"}
                        </div>
                      </div>
                      <div className="flex-1 text-right min-w-0 pl-4 overflow-hidden">
                        <div className="truncate" title={formatDate(event.occurred_at)}>
                          {formatDate(event.occurred_at)}
                        </div>
                      </div>
                      <div className="ml-2 text-gray-400">
                        {isExpanded ? "▼" : "▶"}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-3 pb-3 pt-0 bg-white border-t border-gray-200">
                        <div className="space-y-2 text-sm text-gray-700 pt-2">
                          {event.body && (
                            <div>
                              <span className="font-medium">Description:</span>
                              <p className="mt-1 whitespace-pre-wrap">{event.body}</p>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-2">
                            {event.status && (
                              <div>
                                <span className="font-medium">Status:</span>{" "}
                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${
                                  event.status.toLowerCase() === "open" 
                                    ? "bg-red-100 text-red-800" 
                                    : event.status.toLowerCase() === "resolved"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}>
                                  {event.status}
                                </span>
                              </div>
                            )}
                            {event.severity && (
                              <div>
                                <span className="font-medium">Severity:</span>{" "}
                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${getSeverityBadgeClass(event.severity)}`}>
                                  {event.severity}
                                </span>
                              </div>
                            )}
                            {event.units_affected && (
                              <div>
                                <span className="font-medium">Units Affected:</span>{" "}
                                {event.units_affected}
                              </div>
                            )}
                          </div>
                          {event.occurred_at && (
                            <div>
                              <span className="font-medium">Occurred:</span>{" "}
                              {new Date(event.occurred_at).toLocaleString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}

            <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-200 bg-gray-50">
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
          </div>
        </div>
      </div>
    </div>
  );
}

