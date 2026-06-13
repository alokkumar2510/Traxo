"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  AlertTriangle,
  Search,
  CalendarDays,
  Activity,
  CheckCheck,
  Loader2,
} from "lucide-react";
import { db } from "@/services/firebase";
import { useAuthStore } from "@/store/authStore";
import { collection, query, where, orderBy, onSnapshot, limit } from "firebase/firestore";
import { Tracker, TrackerEvent } from "@/types/database";

type Severity = "high" | "medium" | "low";

function parseDate(timestamp: any): Date | null {
  if (!timestamp) return null;
  try {
    if (timestamp.toDate && typeof timestamp.toDate === "function") {
      return timestamp.toDate();
    }
    if (timestamp instanceof Date) {
      return timestamp;
    }
    if (typeof timestamp.seconds === "number") {
      return new Date(timestamp.seconds * 1000);
    }
    if (typeof timestamp === "string" || typeof timestamp === "number") {
      const d = new Date(timestamp);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  } catch {
    return null;
  }
}

// Helper to format date label
function getGroupedDateLabel(timestamp: any): string {
  if (!timestamp) return "Unknown Date";
  let date: Date;
  if (timestamp.toDate && typeof timestamp.toDate === "function") {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (timestamp.seconds) {
    date = new Date(timestamp.seconds * 1000);
  } else {
    date = new Date(timestamp);
  }
  
  if (isNaN(date.getTime())) return "Unknown Date";
  
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return "Today";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }
}

// Helper to format timestamp time
function formatTime(timestamp: any): string {
  if (!timestamp) return "";
  let date: Date;
  if (timestamp.toDate && typeof timestamp.toDate === "function") {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (timestamp.seconds) {
    date = new Date(timestamp.seconds * 1000);
  } else {
    date = new Date(timestamp);
  }
  if (isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

// Helper to format relative time
function formatRelativeTime(timestamp: any): string {
  if (!timestamp) return "Never";
  let date: Date;
  if (timestamp.toDate && typeof timestamp.toDate === "function") {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (timestamp.seconds) {
    date = new Date(timestamp.seconds * 1000);
  } else {
    date = new Date(timestamp);
  }
  
  if (isNaN(date.getTime())) return "Never";
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  return `${diffDay}d ago`;
}

export default function HistoryPage() {
  const { user } = useAuthStore();
  const [selectedId, setSelectedId] = useState<string>("");
  const [activeTab, setActiveTab] = useState("Overview");
  
  // Filters
  const [selectedTrackerFilter, setSelectedTrackerFilter] = useState<string>("all");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("all");
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Read selected ID from URL on load (from Dashboard links)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get("id");
    if (idParam) {
      setSelectedId(idParam);
      // Clean up URL parameter
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Fetch trackers
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, "trackers"), where("userId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setTrackers(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Tracker));
    });
    return () => unsub();
  }, [user?.uid]);

  // Fetch events across all user's trackers
  useEffect(() => {
    if (trackers.length === 0) {
      setEvents([]);
      setLoading(false);
      return;
    }

    const unsubs = trackers.map((tracker) => {
      const eventsRef = collection(db, "trackers", tracker.id, "events");
      const q = query(eventsRef, orderBy("createdAt", "desc"), limit(50));
      return onSnapshot(q, (snap) => {
        const trackerEvents = snap.docs.map((d) => ({
          id: d.id,
          trackerId: tracker.id,
          trackerName: tracker.name,
          trackerUrl: tracker.url,
          trackerType: tracker.type,
          ...d.data(),
        }));

        setEvents((prev) => {
          const filtered = prev.filter((e) => e.trackerId !== tracker.id);
          const merged = [...filtered, ...trackerEvents];
          return merged.sort((a, b) => {
            const timeA = a.createdAt?.seconds ?? 0;
            const timeB = b.createdAt?.seconds ?? 0;
            return timeB - timeA;
          });
        });
        setLoading(false);
      });
    });

    return () => unsubs.forEach((unsub) => unsub());
  }, [trackers]);

  // Apply filters
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      // Tracker Filter
      if (selectedTrackerFilter !== "all" && e.trackerId !== selectedTrackerFilter) {
        return false;
      }
      // Type Filter
      if (selectedTypeFilter !== "all") {
        if (selectedTypeFilter === "job" && e.type !== "new_job") return false;
        if (selectedTypeFilter === "price" && e.type !== "price_drop" && e.type !== "price_increase") return false;
        if (selectedTypeFilter === "pdf" && e.type !== "pdf_updated") return false;
        if (selectedTypeFilter === "website" && e.type !== "content_changed" && e.type !== "content_added" && e.type !== "content_removed") return false;
      }
      // Severity Filter
      if (selectedSeverityFilter !== "all" && e.severity !== selectedSeverityFilter) {
        return false;
      }
      // Search Query
      if (searchQuery.trim()) {
        const queryLower = searchQuery.toLowerCase();
        const titleMatch = e.title?.toLowerCase().includes(queryLower);
        const summaryMatch = e.summary?.toLowerCase().includes(queryLower);
        const trackerMatch = e.trackerName?.toLowerCase().includes(queryLower);
        if (!titleMatch && !summaryMatch && !trackerMatch) return false;
      }
      return true;
    });
  }, [events, selectedTrackerFilter, selectedTypeFilter, selectedSeverityFilter, searchQuery]);

  // Group events by date
  const groupedEvents = useMemo(() => {
    return filteredEvents.reduce<Record<string, any[]>>((acc, e) => {
      const dateLabel = getGroupedDateLabel(e.createdAt);
      if (!acc[dateLabel]) acc[dateLabel] = [];
      acc[dateLabel].push(e);
      return acc;
    }, {});
  }, [filteredEvents]);

  const selectedEvent = events.find(e => e.id === selectedId);

  const getSeverityStyle = (severity: string) => {
    if (severity === "high") return { text: "High", color: "#EF4444" };
    if (severity === "medium") return { text: "Medium", color: "#F59E0B" };
    return { text: "Low", color: "#22C55E" };
  };

  const getEventTypeStyle = (type: string) => {
    switch (type) {
      case "new_job": return { text: "Job", color: "#22C55E" };
      case "price_drop":
      case "price_increase": return { text: "Price", color: "#3B82F6" };
      case "pdf_updated": return { text: "PDF", color: "#F59E0B" };
      default: return { text: "Content", color: "#06B6D4" };
    }
  };

  const stats = useMemo(() => {
    const total = events.length;
    const changes = events.filter(e => ["content_changed", "price_drop", "price_increase", "new_job", "pdf_updated"].includes(e.type)).length;
    const highAlerts = events.filter(e => e.severity === "high").length;
    
    return [
      { label: "Total Events", value: String(total) },
      { label: "Changes Detected", value: String(changes) },
      { label: "High Severity Alerts", value: String(highAlerts) },
    ];
  }, [events]);

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 text-accent-primary animate-spin" />
        <p className="text-sm font-mono text-foreground-secondary">Loading history...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-0">
      {/* ── Main Panel ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`flex flex-1 min-w-0 flex-col gap-5 ${selectedEvent ? "pr-4" : ""}`}
      >
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">History</h1>
          <p className="mt-1 text-sm text-foreground-secondary">Track all changes and events across your trackers.</p>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tracker Filter */}
          <div className="relative">
            <select
              value={selectedTrackerFilter}
              onChange={(e) => setSelectedTrackerFilter(e.target.value)}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-border-glass bg-bg-glass px-3 text-[12px] text-foreground outline-none focus:border-accent-purple"
            >
              <option value="all">All Trackers</option>
              {trackers.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div className="relative">
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-border-glass bg-bg-glass px-3 text-[12px] text-foreground outline-none focus:border-accent-purple"
            >
              <option value="all">All Event Types</option>
              <option value="website">Content Changes</option>
              <option value="price">Price Drops/Increases</option>
              <option value="job">New Jobs</option>
              <option value="pdf">PDF Updates</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div className="relative">
            <select
              value={selectedSeverityFilter}
              onChange={(e) => setSelectedSeverityFilter(e.target.value)}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-border-glass bg-bg-glass px-3 text-[12px] text-foreground outline-none focus:border-accent-purple"
            >
              <option value="all">All Severity</option>
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
          </div>

          {/* Search bar */}
          <div className="ml-auto flex h-8 items-center gap-2 rounded-lg border border-border-glass bg-bg-glass px-3">
            <Search className="h-3.5 w-3.5 text-foreground-muted" />
            <input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-[12px] text-foreground placeholder:text-foreground-muted outline-none w-32 focus:w-44 transition-all duration-300"
            />
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {stats.map((c) => (
            <div key={c.label} className="glass-card rounded-2xl p-4">
              <p className="text-[11px] text-foreground-secondary">{c.label}</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{c.value}</p>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto">
          {Object.keys(groupedEvents).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center glass-card rounded-2xl p-8">
              <Activity className="h-10 w-10 text-foreground-muted mb-3" />
              <p className="text-sm font-semibold text-foreground">No events recorded</p>
              <p className="text-xs text-foreground-secondary mt-1">
                Trigger a scan on your trackers to detect page content changes and populate history.
              </p>
            </div>
          ) : (
            Object.entries(groupedEvents).map(([date, events]) => (
              <div key={date} className="mb-6">
                {/* Date Label */}
                <div className="mb-3 flex items-baseline gap-2">
                  <span className="text-[13px] font-semibold text-foreground">{date}</span>
                </div>

                {/* Events list */}
                <div className="relative">
                  {/* Vertical line connecting events */}
                  <div className="absolute left-[37px] top-0 bottom-0 w-px bg-border-glass" />

                  <div className="space-y-2">
                    {events.map((event) => {
                      const isSelected = event.id === selectedId;
                      const sev = getSeverityStyle(event.severity);
                      const typeStyle = getEventTypeStyle(event.type);
                      return (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          onClick={() => setSelectedId(event.id)}
                          className={`relative flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-all ${
                            isSelected
                              ? "border border-accent-purple/40 bg-accent-purple/8"
                              : "border border-transparent hover:border-border-glass hover:bg-surface/50"
                          }`}
                        >
                          {/* Time */}
                          <span className="w-16 shrink-0 text-[11px] text-foreground-muted text-right">
                            {formatTime(event.createdAt)}
                          </span>

                          {/* Severity indicator dot */}
                          <div className="relative z-10 flex h-3 w-3 shrink-0 items-center justify-center">
                            <div className="h-3 w-3 rounded-full border-2 border-background" style={{ background: sev.color }} />
                          </div>

                          {/* Favicon fallback */}
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white bg-accent-purple/20 text-accent-purple">
                            {event.trackerName?.[0]?.toUpperCase() || "T"}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-[13px] font-semibold text-foreground">{event.trackerName}</p>
                            </div>
                            <p className="truncate text-[11px] text-foreground-secondary">{event.title} • {event.summary}</p>
                          </div>

                          {/* Type Badge */}
                          <span className="shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-medium" style={{ color: typeStyle.color, background: `${typeStyle.color}15` }}>
                            {typeStyle.text}
                          </span>

                          {/* Severity Label */}
                          <span className="shrink-0 text-[11px] font-semibold" style={{ color: sev.color }}>
                            {sev.text}
                          </span>

                          {/* Arrow */}
                          <ChevronRight className="h-4 w-4 shrink-0 text-foreground-muted" />
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* ── Right Detail Panel ── */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-[360px] shrink-0 glass-card rounded-2xl overflow-hidden flex flex-col"
          >
            {/* Panel Header */}
            <div className="border-b border-border-glass p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[13px] font-semibold text-foreground">Event Details</span>
                <button onClick={() => setSelectedId("")} className="flex h-7 w-7 items-center justify-center rounded text-foreground-muted hover:text-foreground hover:bg-surface">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[12px] font-bold text-white bg-accent-purple">
                  {selectedEvent.trackerName?.[0]?.toUpperCase() || "T"}
                </div>
                <div>
                  <span className="rounded-lg px-2 py-0.5 text-[10px] font-medium uppercase" style={{ color: getEventTypeStyle(selectedEvent.type).color, background: `${getEventTypeStyle(selectedEvent.type).color}20` }}>
                    {selectedEvent.type?.replace("_", " ")}
                  </span>
                  <h3 className="mt-1 text-[15px] font-bold text-foreground">{selectedEvent.title}</h3>
                  <p className="text-[12px] text-foreground-secondary">{selectedEvent.trackerName}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: getSeverityStyle(selectedEvent.severity).color }} />
                  <span className="text-[11px] font-semibold capitalize" style={{ color: getSeverityStyle(selectedEvent.severity).color }}>{selectedEvent.severity} Severity</span>
                </div>
                <span className="text-[11px] text-foreground-muted">
                  {selectedEvent.createdAt ? parseDate(selectedEvent.createdAt)?.toLocaleString() : ""}
                </span>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border-glass">
              {["Overview", "Visual Diff", "Metadata"].map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`flex-1 py-2.5 text-[11px] font-medium transition-colors ${
                    activeTab === t ? "text-accent-primary border-b-2 border-accent-primary" : "text-foreground-muted hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeTab === "Overview" && (
                <>
                  {/* Summary */}
                  <div>
                    <h4 className="mb-2 text-[13px] font-semibold text-foreground">Summary</h4>
                    <p className="text-[12px] text-foreground-secondary leading-relaxed bg-bg-glass p-3 rounded-xl border border-border-glass/40">
                      {selectedEvent.summary}
                    </p>
                  </div>

                  {/* Metadata fields */}
                  <div className="space-y-2 text-[12px]">
                    {[
                      { label: "Tracker Name", value: selectedEvent.trackerName },
                      { label: "Target URL", value: selectedEvent.trackerUrl, link: true },
                      { label: "Detected Time", value: selectedEvent.createdAt ? parseDate(selectedEvent.createdAt)?.toLocaleTimeString() : "N/A" },
                    ].map((r) => (
                      <div key={r.label} className="flex items-center justify-between gap-2">
                        <span className="text-foreground-muted shrink-0">{r.label}</span>
                        <span className={`font-medium flex items-center gap-1 max-w-[150px] truncate ${r.link ? "text-accent-primary cursor-pointer hover:underline" : "text-foreground"}`}>
                          {r.link ? (
                            <a href={selectedEvent.trackerUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1">
                              Link <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            r.value
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {activeTab === "Visual Diff" && (
                <div>
                  <h4 className="text-[13px] font-semibold text-foreground mb-2">Visual Diff Output</h4>
                  {selectedEvent.metadata?.visualDiff?.diffImageUrl ? (
                    <div className="space-y-3">
                      <div className="rounded-xl overflow-hidden border border-border-glass bg-surface">
                        <img
                          src={selectedEvent.metadata.visualDiff.diffImageUrl as string}
                          alt="Visual Diff highlights"
                          className="w-full h-auto object-contain"
                        />
                      </div>
                      <div className="text-[11px] text-foreground-secondary space-y-1 bg-bg-glass p-3 rounded-xl border border-border-glass">
                        <p>Mismatch percentage: <span className="font-semibold text-warning">{String(selectedEvent.metadata.visualDiff.mismatchPercentage)}%</span></p>
                        <p>Total diff pixels: <span className="font-semibold text-foreground">{String(selectedEvent.metadata.visualDiff.diffPixels)}px</span></p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-foreground-muted p-4 bg-bg-glass border border-border-glass rounded-xl text-center">
                      No visual diff screenshot recorded for this event.
                    </p>
                  )}
                </div>
              )}

              {activeTab === "Metadata" && (
                <div>
                  <h4 className="text-[13px] font-semibold text-foreground mb-2">Raw Metadata Parameters</h4>
                  <pre className="text-[10px] font-mono p-3 bg-bg-glass border border-border-glass rounded-xl overflow-x-auto text-foreground-secondary leading-relaxed">
                    {JSON.stringify(selectedEvent.metadata || {}, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
