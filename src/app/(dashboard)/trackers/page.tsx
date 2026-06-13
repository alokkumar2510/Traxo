"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Zap,
  Pause,
  X,
  Plus,
  SlidersHorizontal,
  ChevronDown,
  MoreVertical,
  Clock,
  CheckCircle,
  Star,
  ExternalLink,
  RefreshCw,
  Trash2,
  Play,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Folder,
} from "lucide-react";
import { db } from "@/services/firebase";
import { useAuthStore } from "@/store/authStore";
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, limit } from "firebase/firestore";
import { Tracker, TrackerEvent, ScanRecord } from "@/types/database";
import { TrackerRepository } from "@/services/firestore/trackers";
import CreateTrackerModal from "@/components/trackers/create-tracker-modal";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

type TabFilter = "all" | "active" | "paused" | "failed";

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

// Helper to format next scan remaining time
function formatNextScan(timestamp: any): string {
  if (!timestamp) return "N/A";
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
  
  if (isNaN(date.getTime())) return "N/A";
  
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  if (diffMs <= 0) return "Soon";
  
  const diffMin = Math.floor(diffMs / 1000 / 60);
  const diffHour = Math.floor(diffMin / 60);
  
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHour < 24) return `${diffHour}h ${diffMin % 60}m`;
  return `${Math.ceil(diffHour / 24)}d`;
}

export default function TrackersPage() {
  const { user } = useAuthStore();
  const [filter, setFilter] = useState<TabFilter>("all");
  const [selectedId, setSelectedId] = useState<string>("");
  const [page, setPage] = useState(1);
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<TrackerEvent[]>([]);
  const [selectedScans, setSelectedScans] = useState<ScanRecord[]>([]);
  const [scanningId, setScanningId] = useState<string | null>(null);

  // Check query params for auto-open
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("create") === "true") {
      setIsCreateOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Fetch user's trackers
  useEffect(() => {
    if (!user?.uid) return;
    const trackersRef = collection(db, "trackers");
    const q = query(trackersRef, where("userId", "==", user.uid), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Tracker);
      setTrackers(items);
      setLoading(false);
      
      // Auto-select the first tracker if none is selected
      if (items.length > 0) {
        setSelectedId((prev) => {
          if (!prev || !items.some((item) => item.id === prev)) {
            return items[0].id;
          }
          return prev;
        });
      } else {
        setSelectedId("");
      }
    }, (err) => {
      console.error("Failed to fetch trackers:", err);
      setLoading(false);
    });
    
    return () => unsub();
  }, [user?.uid]);

  // Fetch events and scans for the selected tracker
  useEffect(() => {
    if (!selectedId) {
      setSelectedEvents([]);
      setSelectedScans([]);
      return;
    }
    
    // Subscribe to events
    const eventsRef = collection(db, "trackers", selectedId, "events");
    const eventsQuery = query(eventsRef, orderBy("createdAt", "desc"), limit(10));
    const unsubEvents = onSnapshot(eventsQuery, (snap) => {
      setSelectedEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TrackerEvent));
    }, (err) => console.error(err));

    // Subscribe to scans
    const scansRef = collection(db, "trackers", selectedId, "scans");
    const scansQuery = query(scansRef, orderBy("scannedAt", "desc"), limit(7));
    const unsubScans = onSnapshot(scansQuery, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ScanRecord);
      // Reverse for chronological chart rendering
      setSelectedScans(data.reverse());
    }, (err) => console.error(err));

    return () => {
      unsubEvents();
      unsubScans();
    };
  }, [selectedId]);

  const counts = {
    all: trackers.length,
    active: trackers.filter(t => t.status === "active").length,
    paused: trackers.filter(t => t.status === "paused").length,
    failed: trackers.filter(t => t.status === "error").length,
  };

  const filtered = trackers.filter(t => {
    if (filter === "all") return true;
    if (filter === "failed") return t.status === "error";
    return t.status === filter;
  });

  // Pagination chunking
  const itemsPerPage = 8;
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedTrackers = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const selected = trackers.find(t => t.id === selectedId);

  const handleTogglePause = async (tracker: Tracker) => {
    const nextStatus = tracker.status === "paused" ? "active" : "paused";
    try {
      await TrackerRepository.updateTracker(tracker.id, { status: nextStatus });
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleDeleteTracker = async (trackerId: string) => {
    if (window.confirm("Are you sure you want to delete this tracker?")) {
      try {
        await TrackerRepository.deleteTracker(trackerId);
        if (selectedId === trackerId) {
          setSelectedId("");
        }
      } catch (err) {
        console.error("Failed to delete tracker:", err);
      }
    }
  };

  const handleTriggerScan = async (trackerId: string) => {
    setScanningId(trackerId);
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`https://traxo-api.alokkumarsahu2100.workers.dev/api/trackers/${trackerId}/scan`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      const data = await res.json();
      if (data.success) {
        alert("Scan request queued successfully!");
      } else {
        alert(`Failed to trigger scan: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error triggering scan: ${err.message || err}`);
    } finally {
      setScanningId(null);
    }
  };

  const getTrackerTypeColor = (type: string) => {
    switch (type) {
      case "job": return { text: "#22C55E", bg: "rgba(34,197,94,0.1)" };
      case "price": return { text: "#3B82F6", bg: "rgba(59,130,246,0.1)" };
      case "section": return { text: "#8B5CF6", bg: "rgba(139,92,246,0.1)" };
      case "pdf": return { text: "#F59E0B", bg: "rgba(245,158,11,0.1)" };
      default: return { text: "#06B6D4", bg: "rgba(6,182,212,0.1)" };
    }
  };

  const getStatusStyle = (s: string) => {
    if (s === "active") return { dot: "#22C55E", label: "Active", color: "#22C55E" };
    if (s === "paused") return { dot: "#F59E0B", label: "Paused", color: "#F59E0B" };
    return { dot: "#EF4444", label: "Failed", color: "#EF4444" };
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 text-accent-primary animate-spin" />
        <p className="text-sm font-mono text-foreground-secondary">Loading trackers...</p>
      </div>
    );
  }

  // Map performance scans for the mini-chart
  const chartData = selectedScans.map((s, idx) => {
    const dateObj = s.scannedAt?.toDate ? s.scannedAt.toDate() : new Date(s.scannedAt as any);
    return {
      d: dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit' }),
      v: s.responseTime || 0,
    };
  });

  return (
    <div className="flex h-full gap-0">
      {/* ── Main Panel ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`flex flex-1 min-w-0 flex-col gap-6 ${selected ? "pr-4" : ""}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Trackers</h1>
            <p className="mt-1 text-sm text-foreground-secondary">
              Monitor websites, prices, jobs, PDFs and more. Get notified when changes happen.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex h-9 items-center gap-2 rounded-xl bg-accent-purple px-4 text-sm font-semibold text-white hover:bg-accent-purple/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Tracker
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Total Trackers", value: String(counts.all), icon: <Activity className="h-5 w-5 text-white" />, iconBg: "linear-gradient(135deg,#7C3AED,#8B5CF6)" },
            { label: "Active", value: String(counts.active), icon: <Zap className="h-5 w-5 text-white" />, iconBg: "linear-gradient(135deg,#2563EB,#3B82F6)" },
            { label: "Paused", value: String(counts.paused), icon: <Pause className="h-5 w-5 text-white" />, iconBg: "linear-gradient(135deg,#D97706,#F59E0B)" },
            { label: "Failed", value: String(counts.failed), icon: <X className="h-5 w-5 text-white" />, iconBg: "linear-gradient(135deg,#B91C1C,#EF4444)" },
          ].map((c) => (
            <div key={c.label} className="glass-card flex items-center gap-3 rounded-2xl p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: c.iconBg }}>
                {c.icon}
              </div>
              <div>
                <p className="text-[11px] text-foreground-secondary">{c.label}</p>
                <p className="text-xl font-bold text-foreground">{c.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filter Tabs + Sort */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {(["all", "active", "paused", "failed"] as TabFilter[]).map((tab) => (
              <button
                key={tab}
                onClick={() => { setFilter(tab); setPage(1); }}
                className={`relative flex h-8 items-center gap-2 rounded-lg px-3 text-[13px] font-medium transition-colors ${
                  filter === tab ? "text-foreground" : "text-foreground-secondary hover:text-foreground"
                }`}
              >
                {filter === tab && (
                  <motion.div
                    layoutId="tracker-tab"
                    className="absolute inset-0 rounded-lg border border-border-glass bg-surface"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative capitalize">{tab === "failed" ? "Failed" : tab}</span>
                <span className={`relative rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${filter === tab ? "bg-accent-purple/20 text-accent-purple" : "bg-surface text-foreground-muted"}`}>
                  {counts[tab]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Trackers Table */}
        <div className="glass-card rounded-2xl overflow-hidden">
          {paginatedTrackers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Activity className="h-10 w-10 text-foreground-muted mb-3" />
              <p className="text-sm font-semibold text-foreground">No trackers found</p>
              <p className="text-xs text-foreground-secondary max-w-xs mt-1">
                {filter === "all" ? "Add your first tracker to begin monitoring webpage changes." : `No trackers in '${filter}' status.`}
              </p>
              {filter === "all" && (
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="mt-4 flex h-8 items-center gap-1.5 rounded-lg bg-accent-purple px-3 text-xs font-semibold text-white hover:bg-accent-purple/90"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Tracker
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="grid grid-cols-[1.8fr_1fr_0.8fr_0.7fr_0.5fr_0.5fr_32px] gap-3 border-b border-border-glass px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
                <span>Tracker</span>
                <span>Type</span>
                <span>Status</span>
                <span>Last Check</span>
                <span>Changes</span>
                <span>Next Check</span>
                <span />
              </div>

              {/* Table Rows */}
              <div>
                <AnimatePresence>
                  {paginatedTrackers.map((tracker) => {
                    const st = getStatusStyle(tracker.status);
                    const isSelected = tracker.id === selectedId;
                    const typeStyle = getTrackerTypeColor(tracker.type);
                    return (
                      <motion.div
                        key={tracker.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedId(tracker.id)}
                        className={`grid grid-cols-[1.8fr_1fr_0.8fr_0.7fr_0.5fr_0.5fr_32px] gap-3 items-center border-b border-border-glass/50 px-5 py-3.5 cursor-pointer transition-colors ${
                          isSelected ? "bg-accent-purple/8 border-l-2 border-l-accent-purple" : "hover:bg-surface/50"
                        }`}
                      >
                        {/* Tracker Name */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white bg-accent-purple/20 text-accent-purple">
                            {tracker.name[0]?.toUpperCase() || "T"}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="truncate text-[13px] font-semibold text-foreground">{tracker.name}</p>
                            </div>
                            <p className="truncate text-[11px] text-foreground-muted">{tracker.url}</p>
                          </div>
                        </div>

                        {/* Type */}
                        <span className="rounded-lg px-2 py-1 text-[11px] font-medium w-fit capitalize" style={{ color: typeStyle.text, background: typeStyle.bg }}>
                          {tracker.type}
                        </span>

                        {/* Status */}
                        <div className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: st.dot }} />
                          <span className="text-[12px]" style={{ color: st.color }}>{st.label}</span>
                        </div>

                        {/* Last Check */}
                        <div className="flex items-center gap-1.5 text-[12px] text-foreground-secondary">
                          <span>{tracker.lastScanAt ? formatRelativeTime(tracker.lastScanAt) : "Never"}</span>
                        </div>

                        {/* Changes */}
                        <span className={`text-[14px] font-bold ${tracker.changeCount > 0 ? "text-accent-purple" : "text-foreground-muted"}`}>
                          {tracker.changeCount}
                        </span>

                        {/* Next Check */}
                        <div className="flex items-center gap-1.5 text-[12px] text-foreground-secondary">
                          {tracker.status === "active" ? (
                            <>
                              <Clock className="h-3.5 w-3.5 shrink-0" />
                              <span>{formatNextScan(tracker.nextScanAt)}</span>
                            </>
                          ) : (
                            <span className="flex items-center gap-1 text-warning">
                              <Pause className="h-3.5 w-3.5" /> Paused
                            </span>
                          )}
                        </div>

                        {/* Menu Actions */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTracker(tracker.id);
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground-muted hover:text-error hover:bg-error/10 transition-colors"
                          title="Delete Tracker"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground-secondary text-[13px]">
              Showing {(page - 1) * itemsPerPage + 1} to {Math.min(page * itemsPerPage, filtered.length)} of {filtered.length} trackers
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-glass text-foreground-secondary hover:text-foreground transition-colors disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, idx) => (
                <button
                  key={idx + 1}
                  onClick={() => setPage(idx + 1)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-[13px] font-medium transition-colors ${
                    page === idx + 1 ? "bg-accent-purple text-white" : "border border-border-glass text-foreground-secondary hover:text-foreground"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-glass text-foreground-secondary hover:text-foreground transition-colors disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Right Detail Panel ── */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-[300px] shrink-0 glass-card rounded-2xl overflow-hidden flex flex-col"
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between border-b border-border-glass p-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white bg-accent-purple">
                  {selected.name[0]?.toUpperCase() || "T"}
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-foreground">{selected.name}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: getStatusStyle(selected.status).dot }} />
                    <span className="text-[11px] capitalize" style={{ color: getStatusStyle(selected.status).color }}>{selected.status}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedId("")} className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Summary */}
              <div>
                <h4 className="mb-2 text-[13px] font-semibold text-foreground">Summary</h4>
                <div className="space-y-2 text-[12px]">
                  {[
                    { label: "Type", value: selected.type },
                    { label: "URL", value: selected.url, link: true },
                    { label: "Check Frequency", value: selected.frequency },
                    { label: "Created At", value: selected.createdAt ? new Date(selected.createdAt.seconds * 1000).toLocaleString() : "N/A" },
                    { label: "Last Scan", value: selected.lastScanAt ? formatRelativeTime(selected.lastScanAt) : "Never" },
                  ].map((r) => (
                    <div key={r.label} className="flex items-start justify-between gap-2">
                      <span className="text-foreground-muted shrink-0">{r.label}</span>
                      <span className={`text-right font-medium truncate max-w-[140px] ${r.link ? "text-accent-primary hover:underline cursor-pointer flex items-center gap-1 justify-end" : "text-foreground"}`}>
                        {r.link ? (
                          <a href={selected.url} target="_blank" rel="noreferrer" className="flex items-center gap-1">
                            Link <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="capitalize">{r.value}</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Chart */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-[13px] font-semibold text-foreground">Response Time <span className="text-foreground-muted font-normal">(ms)</span></h4>
                </div>
                {chartData.length === 0 ? (
                  <div className="flex h-20 items-center justify-center rounded-lg bg-bg-glass text-[11px] text-foreground-muted">
                    No scans executed yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={80}>
                    <LineChart data={chartData}>
                      <Line type="monotone" dataKey="v" stroke="#8B5CF6" strokeWidth={2} dot={{ fill: "#8B5CF6", r: 2 }} />
                      <XAxis dataKey="d" hide />
                      <YAxis hide />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Last Change Event */}
              <div className="rounded-xl border border-border-glass bg-bg-glass p-3">
                <h4 className="text-[12px] font-semibold text-foreground mb-2">Last Detected Event</h4>
                {selectedEvents.length === 0 ? (
                  <p className="text-[11px] text-foreground-muted">No changes detected yet.</p>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
                        <CheckCircle className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[12px] font-medium text-foreground">{selectedEvents[0].title}</p>
                        <p className="text-[11px] text-foreground-secondary mt-0.5">{selectedEvents[0].summary}</p>
                        <p className="text-[10px] text-foreground-muted mt-1">{formatRelativeTime(selectedEvents[0].createdAt)}</p>
                      </div>
                    </div>

                    {/* Screenshot image and URL */}
                    {(selectedEvents[0].metadata as any)?.visualDiff?.diffImageUrl ? (
                      <div className="space-y-2">
                        <div className="rounded-lg overflow-hidden border border-border-glass bg-surface/50">
                          <a href={selected.url} target="_blank" rel="noopener noreferrer" className="block relative group/image">
                            <img
                              src={(selectedEvents[0].metadata as any).visualDiff.diffImageUrl}
                              alt="Screenshot of Change"
                              className="w-full h-auto object-cover max-h-[140px] transition-transform duration-300 group-hover/image:scale-[1.01]"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center gap-1">
                              <ExternalLink className="h-3.5 w-3.5 text-white" />
                              <span className="text-[10px] font-semibold text-white">Visit Site</span>
                            </div>
                          </a>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-foreground-secondary">
                          <a href={selected.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-accent-primary transition-colors font-mono font-semibold truncate max-w-[65%]">
                            <span>{selected.url}</span>
                            <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                          </a>
                          <span className="shrink-0 text-foreground-muted">Mismatch: {String((selectedEvents[0].metadata as any).visualDiff.mismatchPercentage)}%</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-[10px] text-foreground-secondary pt-1 border-t border-border-glass/40">
                        <a href={selected.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-accent-primary transition-colors font-mono font-semibold truncate max-w-[95%]">
                          <span>{selected.url}</span>
                          <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Configuration parameters */}
              {selected.type === "price" && selected.priceConfig && (
                <div>
                  <h4 className="mb-2 text-[13px] font-semibold text-foreground">Price Parameters</h4>
                  <div className="space-y-1.5 text-[12px]">
                    <div className="flex justify-between">
                      <span className="text-foreground-muted">Target Alert Price:</span>
                      <span className="text-foreground">{selected.priceConfig.currency} {selected.priceConfig.targetPrice ?? "None"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-muted">Current Price:</span>
                      <span className="text-foreground">{selected.priceConfig.currency} {selected.priceConfig.currentPrice ?? "Pending"}</span>
                    </div>
                  </div>
                </div>
              )}

              {selected.type === "job" && selected.jobConfig && (
                <div>
                  <h4 className="mb-2 text-[13px] font-semibold text-foreground">Job Filter Configurations</h4>
                  <div className="space-y-1.5 text-[12px]">
                    <div className="flex justify-between">
                      <span className="text-foreground-muted">Keywords:</span>
                      <span className="text-foreground max-w-[140px] truncate">{selected.jobConfig.keywords?.join(", ") || "None"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-muted">Location:</span>
                      <span className="text-foreground">{selected.jobConfig.location || "Any"}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Panel Actions */}
            <div className="border-t border-border-glass p-3 flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  onClick={() => handleTogglePause(selected)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-warning/30 bg-warning/10 py-2 text-[12px] font-medium text-warning hover:bg-warning/20 transition-colors"
                >
                  <Pause className="h-3.5 w-3.5" />
                  {selected.status === "paused" ? "Resume" : "Pause"}
                </button>
                <button
                  onClick={() => handleDeleteTracker(selected.id)}
                  className="flex items-center justify-center rounded-xl border border-error/30 bg-error/10 px-3 py-2 text-[12px] font-medium text-error hover:bg-error/20 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={() => handleTriggerScan(selected.id)}
                disabled={selected.status === "paused" || scanningId === selected.id}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-accent-purple py-2 text-[12px] font-semibold text-white hover:bg-accent-purple/90 transition-colors disabled:opacity-50"
              >
                {scanningId === selected.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-3.5 w-3.5 fill-white" />
                )}
                Scan Now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CreateTrackerModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
}
