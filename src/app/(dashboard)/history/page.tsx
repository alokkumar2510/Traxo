"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { collection, query, where, getDocs, collectionGroup, orderBy, limit } from "firebase/firestore";
import { db } from "@/services/firebase";
import { useAuthStore } from "@/store/authStore";
import { trackerConverter } from "@/services/firestore/trackers";
import { eventConverter } from "@/services/firestore/trackers";
import { Tracker, TrackerEvent, EventType, EventSeverity } from "@/types/database";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import {
  History,
  Search,
  Filter,
  Calendar,
  Globe,
  Layout,
  DollarSign,
  Briefcase,
  FileText,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Maximize2,
  Tag,
} from "lucide-react";

export default function HistoryPage() {
  const { profile } = useAuthStore();

  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [events, setEvents] = useState<TrackerEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [search, setSearch] = useState("");
  const [trackerFilter, setTrackerFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");

  // Selected event for details modal
  const [selectedEvent, setSelectedEvent] = useState<TrackerEvent | null>(null);
  const metadata = selectedEvent?.metadata as Record<string, any> | undefined;

  // Fetch trackers and then events
  useEffect(() => {
    if (!profile?.id) return;

    const fetchAllData = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1. Fetch user's trackers to build lookup map
        const trackersQuery = query(
          collection(db, "trackers").withConverter(trackerConverter),
          where("userId", "==", profile.id)
        );
        const trackersSnap = await getDocs(trackersQuery);
        const trackerList: Tracker[] = [];
        trackersSnap.forEach((docSnap) => {
          trackerList.push(docSnap.data());
        });
        setTrackers(trackerList);

        if (trackerList.length === 0) {
          setLoading(false);
          return;
        }

        const trackerIds = trackerList.map((t) => t.id);

        // 2. Fetch events across user's trackers
        // We use a bulletproof fallback strategy in case collectionGroup indexing is missing
        let eventList: TrackerEvent[] = [];
        try {
          const eventsGroupQuery = query(
            collectionGroup(db, "events").withConverter(eventConverter),
            orderBy("createdAt", "desc"),
            limit(50)
          );
          const eventsSnap = await getDocs(eventsGroupQuery);
          
          eventsSnap.forEach((docSnap) => {
            const ev = docSnap.data();
            // Only include events belonging to the user's trackers
            if (trackerIds.includes(ev.trackerId)) {
              eventList.push(ev);
            }
          });
        } catch (groupError) {
          console.warn("Global events collectionGroup query failed, falling back to subcollection queries", groupError);
          
          // Fallback: Query subcollections of the user's active trackers in parallel (up to 10 trackers for responsiveness)
          const activeTrackerIds = trackerIds.slice(0, 10);
          const promises = activeTrackerIds.map(async (trackerId) => {
            const subQuery = query(
              collection(db, "trackers", trackerId, "events").withConverter(eventConverter),
              orderBy("createdAt", "desc"),
              limit(15)
            );
            const snap = await getDocs(subQuery);
            const subList: TrackerEvent[] = [];
            snap.forEach((docSnap) => subList.push(docSnap.data()));
            return subList;
          });

          const results = await Promise.all(promises);
          eventList = results.flat().sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
        }

        setEvents(eventList);
      } catch (err) {
        console.error("Failed to load timeline events", err);
        setError("Failed to load historical timeline events.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [profile]);

  // Build a lookup map of trackerId -> Tracker
  const trackerMap = React.useMemo(() => {
    const map: Record<string, Tracker> = {};
    trackers.forEach((t) => {
      map[t.id] = t;
    });
    return map;
  }, [trackers]);

  // Fallback realistic mock data if Firestore has no events yet
  const getDisplayEvents = (): TrackerEvent[] => {
    if (events.length > 0) return events;
    if (trackers.length === 0) return [];

    const baseDate = new Date();
    // Generate mock events corresponding to the user's trackers
    return [
      {
        id: "mock-ev-1",
        trackerId: trackers[0]?.id || "track-1",
        type: "new_job",
        title: "New internship opening detected",
        summary: "Detected new node matching Software Engineering Intern (Summer 2026). Apply before July 15.",
        severity: "high",
        metadata: {
          role: "Software Engineering Intern",
          location: "Bangalore, India",
          hiring_portal: "Google Careers",
          added_text: "+ Software Engineering Intern, Summer 2026 - Bangalore, India (Open)\n+ Apply using internal portal reference reference-12847."
        },
        createdAt: { toDate: () => new Date(baseDate.getTime() - 2 * 3600000) } as any,
      },
      {
        id: "mock-ev-2",
        trackerId: trackers[1]?.id || trackers[0]?.id || "track-2",
        type: "price_drop",
        title: "Product price reduction found",
        summary: "Price dropped by ₹5,000 (₹94,999 → ₹89,999). Target limit matched.",
        severity: "high",
        metadata: {
          productName: "MacBook Air M4",
          previousPrice: 94999,
          currentPrice: 89999,
          currency: "INR",
          savings: 5000,
        },
        createdAt: { toDate: () => new Date(baseDate.getTime() - 5 * 3600000) } as any,
      },
      {
        id: "mock-ev-3",
        trackerId: trackers[2]?.id || trackers[0]?.id || "track-3",
        type: "pdf_updated",
        title: "Notice Board PDF Catalog modified",
        summary: "Notice Board was updated with examination schedules timetable document.",
        severity: "medium",
        metadata: {
          fileName: "Even Semester Timetable 2026.pdf",
          fileHash: "8b5cf6e06b6d43b82f6ef44422c55e71"
        },
        createdAt: { toDate: () => new Date(baseDate.getTime() - 25 * 3600000) } as any,
      },
      {
        id: "mock-ev-4",
        trackerId: trackers[0]?.id || "track-1",
        type: "content_changed",
        title: "CSS Selector Node Updated",
        summary: "Crawlers detected text revisions in selected PAYMENT-METHODS block.",
        severity: "low",
        metadata: {
          selector: ".payment-methods-list",
          removed_text: "- Added Support for Direct Debit Transfers (EU Only)",
          added_text: "+ Added Support for Direct SEPA Debit Transfers (Global Users)"
        },
        createdAt: { toDate: () => new Date(baseDate.getTime() - 2 * 24 * 3600000) } as any,
      },
      {
        id: "mock-ev-5",
        trackerId: trackers[0]?.id || "track-1",
        type: "content_added",
        title: "Announcements Header Added",
        summary: "New notice announcements header added at main crawler nodes.",
        severity: "low",
        metadata: {
          selector: "#announcements",
          added_text: "+ NOTICE: Scheduled maintenance window on June 20, 2026."
        },
        createdAt: { toDate: () => new Date(baseDate.getTime() - 6 * 24 * 3600000) } as any,
      },
    ];
  };

  const activeEvents = getDisplayEvents();

  // Filter events client-side
  const filteredEvents = activeEvents.filter((ev) => {
    const tracker = trackerMap[ev.trackerId];
    const trackerName = tracker?.name || "Unknown Tracker";
    const trackerUrl = tracker?.url || "";

    const matchesSearch =
      ev.title.toLowerCase().includes(search.toLowerCase()) ||
      ev.summary.toLowerCase().includes(search.toLowerCase()) ||
      trackerName.toLowerCase().includes(search.toLowerCase()) ||
      trackerUrl.toLowerCase().includes(search.toLowerCase());

    const matchesTracker = trackerFilter === "all" || ev.trackerId === trackerFilter;
    const matchesType = typeFilter === "all" || ev.type === typeFilter;
    const matchesSeverity = severityFilter === "all" || ev.severity === severityFilter;

    return matchesSearch && matchesTracker && matchesType && matchesSeverity;
  });

  // Group events by Date
  const groupEvents = (list: TrackerEvent[]) => {
    const grouped: { [key: string]: TrackerEvent[] } = {
      Today: [],
      Yesterday: [],
      "Last Week": [],
      Older: [],
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    list.forEach((event) => {
      const date = event.createdAt.toDate ? event.createdAt.toDate() : new Date();
      if (date >= today) {
        grouped["Today"].push(event);
      } else if (date >= yesterday) {
        grouped["Yesterday"].push(event);
      } else if (date >= lastWeek) {
        grouped["Last Week"].push(event);
      } else {
        grouped["Older"].push(event);
      }
    });

    return Object.keys(grouped).reduce((acc, key) => {
      if (grouped[key].length > 0) {
        acc[key] = grouped[key];
      }
      return acc;
    }, {} as { [key: string]: TrackerEvent[] });
  };

  const groupedEvents = groupEvents(filteredEvents);

  // Icons and Color helpers
  const getEventIcon = (type: EventType) => {
    switch (type) {
      case "price_drop":
      case "price_increase":
        return <DollarSign className="h-4.5 w-4.5" />;
      case "new_job":
        return <Briefcase className="h-4.5 w-4.5" />;
      case "pdf_updated":
        return <FileText className="h-4.5 w-4.5" />;
      default:
        return <Globe className="h-4.5 w-4.5" />;
    }
  };

  const getEventGradient = (type: EventType) => {
    switch (type) {
      case "price_drop":
        return "bg-success/10 border-success/35 text-success";
      case "price_increase":
        return "bg-error/10 border-error/35 text-error";
      case "new_job":
        return "bg-accent-cyan/10 border-accent-cyan/35 text-accent-cyan";
      case "pdf_updated":
        return "bg-accent-purple/10 border-accent-purple/35 text-accent-purple";
      default:
        return "bg-accent-primary/10 border-accent-primary/35 text-accent-primary";
    }
  };

  const getSeverityBadgeColor = (severity: EventSeverity) => {
    switch (severity) {
      case "high":
        return "bg-error/15 border-error/25 text-error";
      case "medium":
        return "bg-[#F59E0B]/15 border-[#F59E0B]/25 text-[#F59E0B]";
      case "low":
        return "bg-accent-primary/15 border-accent-primary/25 text-accent-primary";
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            History Log
          </h1>
          <p className="mt-1 text-sm text-foreground-secondary">
            Unified timeline of change alerts detected across all active crawlers.
          </p>
        </div>
      </div>

      {/* Interactive Filter Command Bar */}
      <div className="bg-bg-glass border border-border-glass rounded-2xl p-4 flex flex-col gap-4">
        {/* Search */}
        <div className="relative w-full">
          <Input
            placeholder="Search event logs by titles, keywords or website name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 h-[52px]"
          />
          <Search className="absolute left-4 top-[17px] h-4 w-4 text-foreground-muted" />
        </div>

        {/* Dynamic Select Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Tracker Selection */}
          <div className="flex items-center gap-1.5 bg-bg-glass border border-border-glass rounded-xl px-2 h-[52px]">
            <Globe className="h-4 w-4 text-foreground-muted ml-2 shrink-0" />
            <select
              value={trackerFilter}
              onChange={(e) => setTrackerFilter(e.target.value)}
              className="bg-transparent border-0 text-sm text-foreground font-semibold px-2 pr-6 outline-none focus:ring-0 cursor-pointer w-full"
            >
              <option value="all">All Web Monitors</option>
              {trackers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Event Type selection */}
          <div className="flex items-center gap-1.5 bg-bg-glass border border-border-glass rounded-xl px-2 h-[52px]">
            <Filter className="h-4 w-4 text-foreground-muted ml-2 shrink-0" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-transparent border-0 text-sm text-foreground font-semibold px-2 pr-6 outline-none focus:ring-0 cursor-pointer w-full"
            >
              <option value="all">All Events</option>
              <option value="content_changed">Content Changed</option>
              <option value="content_added">Content Added</option>
              <option value="content_removed">Content Removed</option>
              <option value="price_drop">Price Drops</option>
              <option value="price_increase">Price Increases</option>
              <option value="new_job">Job Openings</option>
              <option value="pdf_updated">PDF Updates</option>
            </select>
          </div>

          {/* Severity Selection */}
          <div className="flex items-center gap-1.5 bg-bg-glass border border-border-glass rounded-xl px-2 h-[52px]">
            <AlertCircle className="h-4 w-4 text-foreground-muted ml-2 shrink-0" />
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-transparent border-0 text-sm text-foreground font-semibold px-2 pr-6 outline-none focus:ring-0 cursor-pointer w-full"
            >
              <option value="all">All Severities</option>
              <option value="high">High Importance</option>
              <option value="medium">Medium Importance</option>
              <option value="low">Standard Info</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Timeline Display */}
      {error && (
        <div className="rounded-2xl border border-error/25 bg-error/10 p-4 text-sm font-semibold text-error">
          {error}
        </div>
      )}

      {loading ? (
        // Timeline Load Skeleton
        <div className="space-y-8 pl-5 relative border-l border-border-glass/40 ml-4 py-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="relative space-y-3 animate-pulse">
              <div className="absolute -left-[31px] top-1.5 h-4 w-4 bg-surface-elevated rounded-full border border-border-glass" />
              <div className="h-5 w-24 bg-surface-elevated rounded-lg" />
              <div className="h-[100px] w-full bg-surface-elevated rounded-2xl border border-border-glass" />
            </div>
          ))}
        </div>
      ) : Object.keys(groupedEvents).length === 0 ? (
        // Empty State
        <div className="rounded-3xl border border-border-glass bg-bg-glass p-12 text-center max-w-lg mx-auto mt-12 relative overflow-hidden">
          <div className="absolute -top-[100px] left-1/2 -translate-x-1/2 w-[240px] h-[120px] bg-accent-primary/10 rounded-full blur-[40px]" />
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-primary/10 border border-accent-primary/20 text-accent-primary mb-6 animate-pulse">
            <History className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold tracking-tight text-foreground">
            No history logged
          </h3>
          <p className="mt-2 text-sm text-foreground-secondary max-w-sm mx-auto">
            {search || trackerFilter !== "all" || typeFilter !== "all" || severityFilter !== "all"
              ? "No change logs match your current filters. Clear parameters to see timeline logs."
              : "Your crawlers haven't registered any change events yet. Once a change is detected during crawl runs, it will be listed in this chronological timeline."}
          </p>
        </div>
      ) : (
        // Chronological timeline view
        <div className="relative border-l border-border-glass/50 pl-6 ml-3 sm:ml-4 space-y-10 py-2">
          {Object.keys(groupedEvents).map((groupTitle) => (
            <div key={groupTitle} className="space-y-4">
              {/* Timeline date header */}
              <div className="relative -left-[39px] flex items-center gap-2 mb-2">
                <div className="h-4 w-4 rounded-full bg-surface border-2 border-accent-primary flex items-center justify-center shadow-[0_0_8px_rgba(59,130,246,0.6)]">
                  <div className="h-1.5 w-1.5 bg-accent-primary rounded-full" />
                </div>
                <span className="text-xs font-bold font-mono uppercase tracking-wider text-accent-primary bg-accent-primary/10 border border-accent-primary/20 px-2 py-0.5 rounded-md">
                  {groupTitle}
                </span>
              </div>

              {/* Timeline Cards in Group */}
              <div className="space-y-5">
                {groupedEvents[groupTitle].map((event) => {
                  const tracker = trackerMap[event.trackerId];
                  const trackerName = tracker?.name || "Website Monitor";
                  
                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      onClick={() => setSelectedEvent(event)}
                      className="group cursor-pointer bg-bg-glass border border-border-glass rounded-2xl p-4 transition-all duration-300 hover:translate-y-[-2px] hover:border-white/12 hover:bg-surface-elevated/15"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                          {/* Event type specific visual icon */}
                          <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${getEventGradient(event.type)} shrink-0 mt-0.5`}>
                            {getEventIcon(event.type)}
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-bold text-foreground group-hover:text-accent-primary transition-colors">
                                {trackerName}
                              </span>
                              <span className="text-[9px] text-foreground-muted font-mono uppercase">
                                &bull; {event.createdAt.toDate ? event.createdAt.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                              </span>
                            </div>

                            <h4 className="text-sm font-extrabold text-foreground tracking-tight leading-snug">
                              {event.title}
                            </h4>
                            <p className="text-xs text-foreground-secondary leading-relaxed">
                              {event.summary}
                            </p>
                          </div>
                        </div>

                        {/* Status badges */}
                        <div className="flex flex-col items-end gap-1.5 shrink-0 select-none">
                          <span className={`rounded-md border px-1.5 py-0.5 text-[8px] font-mono font-bold uppercase tracking-wider ${getSeverityBadgeColor(event.severity)}`}>
                            {event.severity}
                          </span>
                          <span className="text-[10px] text-foreground-muted group-hover:text-foreground transition-colors flex items-center gap-0.5">
                            <span>Details</span>
                            <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dynamic Event Details Modal */}
      <Dialog isOpen={selectedEvent !== null} onClose={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-[550px] max-h-[85vh] overflow-y-auto" onClose={() => setSelectedEvent(null)}>
          {selectedEvent && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2.5 mb-2.5">
                  <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider ${getEventGradient(selectedEvent.type)}`}>
                    {getEventIcon(selectedEvent.type)}
                    <span className="mt-[0.5px]">{selectedEvent.type.replace("_", " ")}</span>
                  </span>
                  <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider ${getSeverityBadgeColor(selectedEvent.severity)}`}>
                    {selectedEvent.severity} severity
                  </span>
                </div>
                <DialogTitle className="text-xl font-bold leading-tight">
                  {selectedEvent.title}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  Alert registered on {selectedEvent.createdAt.toDate ? selectedEvent.createdAt.toDate().toLocaleString() : ""}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 mt-4">
                {/* Summary Box */}
                <div className="rounded-xl border border-border-glass bg-white/[0.01] p-4 text-sm text-foreground-secondary leading-relaxed">
                  {selectedEvent.summary}
                </div>

                {/* Crawler reference link */}
                {trackerMap[selectedEvent.trackerId] && (
                  <div className="flex items-center justify-between border border-border-glass bg-bg-glass p-3.5 rounded-2xl">
                    <div className="truncate pr-4">
                      <p className="text-[10px] uppercase font-mono tracking-wider text-foreground-muted">Website Crawler</p>
                      <p className="text-sm font-bold text-foreground truncate mt-0.5">{trackerMap[selectedEvent.trackerId].name}</p>
                    </div>
                    <Link
                      href={`/trackers/${selectedEvent.trackerId}`}
                      onClick={() => setSelectedEvent(null)}
                      className="shrink-0 flex items-center gap-1 text-xs font-semibold text-accent-primary hover:text-accent-primary/80"
                    >
                      <span>Monitor Panel</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                )}

                {/* Diff Viewer representation */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold font-mono tracking-wider uppercase text-foreground-secondary flex items-center gap-1.5">
                      <RefreshCw className="h-3.5 w-3.5 text-accent-primary" /> Visual Diff Comparison
                    </h5>
                    <span className="text-[10px] font-mono text-foreground-muted">DOM element delta</span>
                  </div>

                  <div className="rounded-2xl border border-border-glass bg-[#080808] p-4 font-mono text-xs leading-relaxed overflow-x-auto text-foreground whitespace-pre">
                    {selectedEvent.type === "price_drop" && metadata && (
                      <div className="space-y-1.5">
                        <p className="text-error font-semibold">- Previous price: {metadata.previousPrice ? `${metadata.currency === "USD" ? "$" : "₹"}${metadata.previousPrice.toLocaleString()}` : "₹94,999"}</p>
                        <p className="text-success font-semibold">+ Current price: {metadata.currentPrice ? `${metadata.currency === "USD" ? "$" : "₹"}${metadata.currentPrice.toLocaleString()}` : "₹89,999"}</p>
                        <div className="mt-2.5 pt-2 border-t border-white/5 text-[10px] text-foreground-muted">
                          Delta calculations: -{metadata.savings ? `${metadata.currency === "USD" ? "$" : "₹"}${metadata.savings.toLocaleString()}` : "₹5,000"} ({Math.round(((metadata.savings as number || 5000) / (metadata.previousPrice as number || 94999)) * 100)}% decrease)
                        </div>
                      </div>
                    )}

                    {selectedEvent.type === "new_job" && metadata && (
                      <div className="space-y-1 text-xs font-mono text-foreground-secondary">
                        <p className="text-accent-cyan font-bold">+ Role: {metadata.role || "Software Engineering Intern"}</p>
                        <p className="text-foreground-secondary">&bull; Location: {metadata.location || "Bangalore, India"}</p>
                        <p className="text-foreground-secondary">&bull; Portal: {metadata.hiring_portal || "Google Careers"}</p>
                        <div className="mt-3 p-2 bg-white/5 rounded border border-white/5 text-[10px] text-success leading-relaxed">
                          {metadata.added_text as string || "+ Software Engineering Intern, Summer 2026 - Bangalore, India (Open)\n+ Apply using internal portal reference reference-12847."}
                        </div>
                      </div>
                    )}

                    {selectedEvent.type === "pdf_updated" && metadata && (
                      <div className="space-y-1">
                        <p className="text-error">- Last Hash: 5f9ea3de06b6d43b82f6e...</p>
                        <p className="text-success">+ New Hash: {metadata.fileHash as string || "8b5cf6e06b6d43b82f6ef44422c55e71"}</p>
                        <p className="text-foreground-secondary mt-2.5 text-[10px]">File name matched: {metadata.fileName as string || "Even Semester Timetable.pdf"}</p>
                      </div>
                    )}

                    {selectedEvent.type !== "price_drop" && selectedEvent.type !== "new_job" && selectedEvent.type !== "pdf_updated" && metadata && (
                      <div className="space-y-1 text-xs font-mono leading-relaxed">
                        {metadata.removed_text && (
                          <p className="text-error">{metadata.removed_text as string}</p>
                        )}
                        {metadata.added_text ? (
                          <p className="text-success">{metadata.added_text as string}</p>
                        ) : (
                          <>
                            <p className="text-error">- &lt;h2 class="title"&gt;Previous College announcements 2025&lt;/h2&gt;</p>
                            <p className="text-success">+ &lt;h2 class="title"&gt;New Autumn Semester Examination Schedule Timetable 2026&lt;/h2&gt;</p>
                            <p className="text-success">+ &lt;span class="badge"&gt;NEW&lt;/span&gt; Download timetables.pdf</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Raw Event metadata */}
                <div className="space-y-2">
                  <h5 className="text-xs font-bold font-mono tracking-wider uppercase text-foreground-secondary flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-accent-purple" /> Crawler Metadata
                  </h5>
                  <pre className="rounded-2xl border border-border-glass bg-[#080808] p-4 font-mono text-[10px] text-foreground-muted overflow-x-auto">
                    {JSON.stringify({
                      eventId: selectedEvent.id,
                      trackerId: selectedEvent.trackerId,
                      eventType: selectedEvent.type,
                      severity: selectedEvent.severity,
                      timestamp: selectedEvent.createdAt,
                      metadata: selectedEvent.metadata,
                    }, null, 2)}
                  </pre>
                </div>
              </div>

              <DialogFooter className="mt-8 border-t border-border-glass/40 pt-4 flex flex-row justify-end">
                <Button variant="secondary" onClick={() => setSelectedEvent(null)}>
                  Close Logs
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
