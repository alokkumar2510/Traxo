"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "@/store/authStore";
import { TrackerRepository } from "@/services/firestore/trackers";
import { CollectionRepository } from "@/services/firestore/collections";
import { NotificationRepository } from "@/services/firestore/notifications";
import { Tracker, Collection, NotificationLog, TrackerEvent } from "@/types/database";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  Layers,
  Activity,
  Bell,
  Sparkles,
  Calendar,
  X,
  CheckCircle,
  AlertCircle,
  FileText,
  DollarSign,
  Briefcase,
  Clock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SearchPage() {
  const { user } = useAuthStore();
  const userId = user?.uid;

  // Search inputs
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "trackers" | "events" | "collections" | "notifications">("all");

  // Filters state
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCollection, setFilterCollection] = useState<string>("all");
  const [filterDateRange, setFilterDateRange] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Loaded database entities
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [events, setEvents] = useState<TrackerEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load datasets on mount
  useEffect(() => {
    if (!userId) return;

    const loadData = async () => {
      try {
        setIsLoading(true);
        // 1. Fetch collections
        const cols = await CollectionRepository.listCollections(userId);
        setCollections(cols);

        // 2. Fetch trackers
        const { trackers: trks } = await TrackerRepository.listTrackers(userId, 100);
        setTrackers(trks);

        // 3. Fetch notifications
        const { notifications: notifs } = await NotificationRepository.listNotifications(userId, 100);
        setNotifications(notifs);

        // 4. Fetch events for top active trackers in parallel
        const eventPromises = trks.slice(0, 15).map((t) =>
          TrackerRepository.listEvents(t.id, 10).catch(() => [] as TrackerEvent[])
        );
        const eventLists = await Promise.all(eventPromises);
        const mergedEvents = eventLists.flat().sort((a, b) => {
          const aTime = a.createdAt?.toDate?.()?.getTime() ?? 0;
          const bTime = b.createdAt?.toDate?.()?.getTime() ?? 0;
          return bTime - aTime;
        });
        setEvents(mergedEvents);
      } catch (err) {
        console.error("Failed to load search data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [userId]);

  // Reset filters
  const resetFilters = () => {
    setFilterType("all");
    setFilterStatus("all");
    setFilterCollection("all");
    setFilterDateRange("all");
    setSearchQuery("");
  };

  // Date Range filter helper
  const matchesDateRange = (date: any) => {
    if (filterDateRange === "all" || !date) return true;
    const itemDate = date.toDate?.() ?? new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - itemDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (filterDateRange === "24h") return diffDays <= 1;
    if (filterDateRange === "7d") return diffDays <= 7;
    if (filterDateRange === "30d") return diffDays <= 30;
    return true;
  };

  // Filter and search computation
  const filteredTrackers = useMemo(() => {
    return trackers.filter((t) => {
      const matchesSearch =
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description?.toLowerCase() ?? "").includes(searchQuery.toLowerCase()) ||
        t.url.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === "all" || t.type === filterType;
      const matchesStatus = filterStatus === "all" || t.status === filterStatus;
      const matchesCol = filterCollection === "all" || t.collectionId === filterCollection;
      const matchesDate = matchesDateRange(t.createdAt);

      return matchesSearch && matchesType && matchesStatus && matchesCol && matchesDate;
    });
  }, [trackers, searchQuery, filterType, filterStatus, filterCollection, filterDateRange]);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const tracker = trackers.find((t) => t.id === e.trackerId);
      const matchesSearch =
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tracker?.name.toLowerCase() ?? "").includes(searchQuery.toLowerCase());
      const matchesType = filterType === "all" || tracker?.type === filterType;
      const matchesCol = filterCollection === "all" || tracker?.collectionId === filterCollection;
      const matchesDate = matchesDateRange(e.createdAt);

      return matchesSearch && matchesType && matchesCol && matchesDate;
    });
  }, [events, trackers, searchQuery, filterType, filterCollection, filterDateRange]);

  const filteredCollections = useMemo(() => {
    return collections.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.description?.toLowerCase() ?? "").includes(searchQuery.toLowerCase());
      const matchesDate = matchesDateRange(c.createdAt);
      return matchesSearch && matchesDate;
    });
  }, [collections, searchQuery, filterDateRange]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      const tracker = trackers.find((t) => t.id === n.trackerId);
      const matchesSearch =
        (tracker?.name.toLowerCase() ?? "").includes(searchQuery.toLowerCase()) ||
        n.channel.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === "all" || tracker?.type === filterType;
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "active" && !n.read) ||
        (filterStatus === "paused" && n.read);
      const matchesDate = matchesDateRange(n.createdAt);

      return matchesSearch && matchesType && matchesStatus && matchesDate;
    });
  }, [notifications, trackers, searchQuery, filterType, filterStatus, filterDateRange]);

  // Combined Results Count
  const totalResultsCount =
    filteredTrackers.length +
    filteredEvents.length +
    filteredCollections.length +
    filteredNotifications.length;

  const getTrackerTypeIcon = (type: string) => {
    switch (type) {
      case "job":
        return <Briefcase className="h-4 w-4" />;
      case "price":
        return <DollarSign className="h-4 w-4" />;
      case "pdf":
        return <FileText className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getTrackerStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <span className="h-2 w-2 rounded-full bg-success pulse-success inline-block" />;
      case "paused":
        return <span className="h-2 w-2 rounded-full bg-warning inline-block" />;
      case "error":
      default:
        return <span className="h-2 w-2 rounded-full bg-error pulse-error inline-block" />;
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Advanced Global Search
        </h1>
        <p className="mt-1 text-sm text-foreground-secondary">
          Find trackers, collection folders, notifications, and logged events instantly.
        </p>
      </div>

      {/* Search Input Card */}
      <Card className="border border-border-glass bg-bg-glass backdrop-blur-md">
        <CardContent className="p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground-muted" />
              <input
                type="text"
                placeholder="Search queries, websites, tags, notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 rounded-xl border border-border-glass bg-surface/50 pl-12 pr-4 text-sm text-foreground placeholder-foreground-muted outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/50 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button
              variant={showFilters ? "default" : "secondary"}
              onClick={() => setShowFilters(!showFilters)}
              className="h-12 px-4 flex items-center gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filters</span>
            </Button>
          </div>

          {/* Filters Expanded View */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-border-glass mt-2">
                  {/* Type Filter */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-foreground-secondary">
                      Tracker Type
                    </label>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="h-10 rounded-lg border border-border-glass bg-surface text-xs text-foreground px-3 outline-none focus:border-accent-primary"
                    >
                      <option value="all">All Types</option>
                      <option value="website">Website</option>
                      <option value="section">Section</option>
                      <option value="price">Price Watch</option>
                      <option value="job">Job Board</option>
                      <option value="pdf">PDF File</option>
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-foreground-secondary">
                      Status / State
                    </label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="h-10 rounded-lg border border-border-glass bg-surface text-xs text-foreground px-3 outline-none focus:border-accent-primary"
                    >
                      <option value="all">All Statuses</option>
                      <option value="active">Active / Unread</option>
                      <option value="paused">Paused / Read</option>
                      <option value="error">Error State</option>
                    </select>
                  </div>

                  {/* Collection Filter */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-foreground-secondary">
                      Collection Folder
                    </label>
                    <select
                      value={filterCollection}
                      onChange={(e) => setFilterCollection(e.target.value)}
                      className="h-10 rounded-lg border border-border-glass bg-surface text-xs text-foreground px-3 outline-none focus:border-accent-primary"
                    >
                      <option value="all">All Collections</option>
                      {collections.map((col) => (
                        <option key={col.id} value={col.id}>
                          {col.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date Range Filter */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-foreground-secondary">
                      Date Range
                    </label>
                    <select
                      value={filterDateRange}
                      onChange={(e) => setFilterDateRange(e.target.value)}
                      className="h-10 rounded-lg border border-border-glass bg-surface text-xs text-foreground px-3 outline-none focus:border-accent-primary"
                    >
                      <option value="all">All Time</option>
                      <option value="24h">Last 24 Hours</option>
                      <option value="7d">Last 7 Days</option>
                      <option value="30d">Last 30 Days</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-4">
                  <Button variant="secondary" onClick={resetFilters} className="text-xs h-9">
                    Clear Filters
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Tabs Menu */}
      <div className="flex border-b border-border-glass">
        {(["all", "trackers", "events", "collections", "notifications"] as const).map((tab) => {
          const count =
            tab === "all"
              ? totalResultsCount
              : tab === "trackers"
              ? filteredTrackers.length
              : tab === "events"
              ? filteredEvents.length
              : tab === "collections"
              ? filteredCollections.length
              : filteredNotifications.length;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                activeTab === tab
                  ? "border-accent-primary text-foreground"
                  : "border-transparent text-foreground-secondary hover:text-foreground"
              }`}
            >
              <span className="capitalize">{tab}</span>
              <span className="ml-1.5 rounded-full bg-surface-elevated px-2 py-0.5 font-mono text-[10px] text-foreground-muted">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Results Section */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Clock className="h-8 w-8 text-accent-primary animate-spin" />
          <p className="text-xs text-foreground-secondary font-mono">Loading Watchlist Catalog...</p>
        </div>
      ) : totalResultsCount === 0 ? (
        <div className="text-center py-20 border border-dashed border-border-glass rounded-2xl">
          <Sparkles className="mx-auto h-10 w-10 text-foreground-muted mb-4" />
          <h3 className="text-sm font-bold text-foreground">No matches found</h3>
          <p className="text-xs text-foreground-secondary mt-1">
            Try adjusting your search terms or filters.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* 1. Trackers List */}
          {(activeTab === "all" || activeTab === "trackers") && filteredTrackers.length > 0 && (
            <div className="flex flex-col gap-3">
              {activeTab === "all" && (
                <h4 className="text-xs font-bold font-mono tracking-wider uppercase text-foreground-muted">
                  Trackers ({filteredTrackers.length})
                </h4>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTrackers.map((t) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={t.id}
                    className="glass-card rounded-2xl p-5 flex flex-col justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl bg-surface-elevated flex items-center justify-center border border-border-glass text-foreground-secondary">
                          {getTrackerTypeIcon(t.type)}
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-foreground truncate max-w-[200px]">
                            {t.name}
                          </h5>
                          <p className="text-[10px] text-foreground-muted font-mono truncate max-w-[220px]">
                            {t.url}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 bg-surface px-2 py-0.5 rounded-full border border-border-glass text-[10px]">
                        {getTrackerStatusBadge(t.status)}
                        <span className="capitalize">{t.status}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-foreground-secondary border-t border-border-glass pt-3 mt-1 font-mono">
                      <span>Frequency: {t.frequency}</span>
                      <span>Changes: {t.changeCount}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Events List */}
          {(activeTab === "all" || activeTab === "events") && filteredEvents.length > 0 && (
            <div className="flex flex-col gap-3 mt-4">
              {activeTab === "all" && (
                <h4 className="text-xs font-bold font-mono tracking-wider uppercase text-foreground-muted">
                  Events ({filteredEvents.length})
                </h4>
              )}
              <div className="flex flex-col gap-3">
                {filteredEvents.map((e) => (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={e.id}
                    className="glass-card rounded-xl p-4 flex justify-between items-center gap-4 cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary mt-0.5">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-foreground">{e.title}</h5>
                        <p className="text-[10px] text-foreground-secondary">{e.summary}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-foreground-muted font-mono whitespace-nowrap">
                      {e.createdAt?.toDate?.()?.toLocaleDateString() ?? "Recent"}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Collections List */}
          {(activeTab === "all" || activeTab === "collections") && filteredCollections.length > 0 && (
            <div className="flex flex-col gap-3 mt-4">
              {activeTab === "all" && (
                <h4 className="text-xs font-bold font-mono tracking-wider uppercase text-foreground-muted">
                  Collections ({filteredCollections.length})
                </h4>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {filteredCollections.map((c) => (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={c.id}
                    className="glass-card rounded-2xl p-4 flex justify-between items-center cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center text-accent-purple">
                        <Layers className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-foreground">{c.name}</h5>
                        <p className="text-[10px] text-foreground-muted">
                          {c.trackerCount} watchers
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Notifications List */}
          {(activeTab === "all" || activeTab === "notifications") && filteredNotifications.length > 0 && (
            <div className="flex flex-col gap-3 mt-4">
              {activeTab === "all" && (
                <h4 className="text-xs font-bold font-mono tracking-wider uppercase text-foreground-muted">
                  Notifications ({filteredNotifications.length})
                </h4>
              )}
              <div className="flex flex-col gap-3">
                {filteredNotifications.map((n) => (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={n.id}
                    className="glass-card rounded-xl p-4 flex justify-between items-center cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center text-accent-cyan">
                        <Bell className="h-4 w-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-foreground capitalize">
                          Channel: {n.channel}
                        </h5>
                        <p className="text-[10px] text-foreground-secondary">
                          Status: {n.status} &bull; Read: {n.read ? "Yes" : "No"}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] text-foreground-muted font-mono">
                      {n.createdAt?.toDate?.()?.toLocaleTimeString() ?? "Recent"}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
