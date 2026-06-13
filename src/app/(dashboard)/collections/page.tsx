"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderOpen,
  Zap,
  TrendingUp,
  Bell,
  Plus,
  Grid3X3,
  List,
  MoreVertical,
  Star,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Trash2,
  Share2,
  Loader2,
  Briefcase,
  DollarSign,
  Globe,
  FileText,
} from "lucide-react";
import { db } from "@/services/firebase";
import { useAuthStore } from "@/store/authStore";
import { collection, query, where, orderBy, onSnapshot, doc, getDocs } from "firebase/firestore";
import { Collection, Tracker } from "@/types/database";
import { CollectionRepository } from "@/services/firestore/collections";
import { Timestamp } from "firebase/firestore";

type TabFilter = "all" | "favorites";
type ViewMode = "grid" | "list";

const AVAILABLE_COLORS = ["#3B82F6", "#EF4444", "#22C55E", "#8B5CF6", "#F59E0B", "#06B6D4", "#EC4899"];
const AVAILABLE_ICONS = ["folder", "briefcase", "dollar", "globe", "document"];

export default function CollectionsPage() {
  const { user } = useAuthStore();
  const userId = user?.uid;

  const [tab, setTab] = useState<TabFilter>("all");
  const [view, setView] = useState<ViewMode>("grid");
  const [selectedId, setSelectedId] = useState<string>("");
  const [collections, setCollections] = useState<Collection[]>([]);
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [loading, setLoading] = useState(true);

  // New Collection Modal Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const [icon, setIcon] = useState("folder");
  const [starred, setStarred] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch collections
  useEffect(() => {
    if (!userId) return;
    const collectionsRef = collection(db, "users", userId, "collections");
    const q = query(collectionsRef, orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setCollections(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Collection));
      setLoading(false);
    });
    return () => unsub();
  }, [userId]);

  // Fetch user's trackers
  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, "trackers"), where("userId", "==", userId));
    const unsub = onSnapshot(q, (snap) => {
      setTrackers(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Tracker));
    });
    return () => unsub();
  }, [userId]);

  // Auto-select first collection on load
  useEffect(() => {
    if (collections.length > 0 && !selectedId) {
      setSelectedId(collections[0].id);
    }
  }, [collections, selectedId]);

  // Group trackers by collection ID
  const trackersByCollection = useMemo(() => {
    const map: Record<string, Tracker[]> = {};
    trackers.forEach((t) => {
      if (t.collectionId) {
        if (!map[t.collectionId]) map[t.collectionId] = [];
        map[t.collectionId].push(t);
      }
    });
    return map;
  }, [trackers]);

  // Filter collections
  const filteredCollections = useMemo(() => {
    return collections.filter((c) => {
      if (tab === "favorites") {
        // Here we assume star/favorite status can be mapped or is stored in the collection doc (starred: boolean)
        return (c as any).starred === true;
      }
      return true;
    });
  }, [collections, tab]);

  const selected = collections.find(c => c.id === selectedId);
  const selectedTrackers = selected ? (trackersByCollection[selected.id] || []) : [];

  // Counts for Stats
  const stats = useMemo(() => {
    const activeCols = collections.filter(c => (trackersByCollection[c.id]?.length || 0) > 0).length;
    const totalChanges = trackers.reduce((sum, t) => sum + (t.changeCount || 0), 0);
    return [
      { label: "Total Collections", value: String(collections.length), sub: "Grouped folders", iconBg: "linear-gradient(135deg,#7C3AED,#8B5CF6)" },
      { label: "Total Trackers", value: String(trackers.length), sub: "Live scanners", iconBg: "linear-gradient(135deg,#2563EB,#3B82F6)" },
      { label: "Active Collections", value: String(activeCols), sub: "With trackers running", iconBg: "linear-gradient(135deg,#16A34A,#22C55E)" },
      { label: "Alerts / Changes", value: String(totalChanges), sub: "Total detected updates", iconBg: "linear-gradient(135deg,#D97706,#F59E0B)" },
    ];
  }, [collections, trackers, trackersByCollection]);

  // Toggle Starred Collection status
  const handleToggleStar = async (col: Collection) => {
    if (!userId) return;
    try {
      const nextStarred = !(col as any).starred;
      await CollectionRepository.updateCollection(userId, col.id, { starred: nextStarred } as any);
    } catch (err) {
      console.error("Failed to star collection:", err);
    }
  };

  // Delete Collection
  const handleDeleteCollection = async (collectionId: string) => {
    if (!userId) return;
    if (window.confirm("Are you sure you want to delete this collection? Trackers inside will be unassigned but not deleted.")) {
      try {
        await CollectionRepository.deleteCollection(userId, collectionId);
        setSelectedId("");
      } catch (err) {
        console.error("Failed to delete collection:", err);
      }
    }
  };

  // Submit New Collection form
  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    if (!name.trim()) {
      setFormError("Collection name is required.");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const collectionId = crypto.randomUUID();
      const newCol: Collection = {
        id: collectionId,
        name: name.trim(),
        description: description.trim() || undefined,
        color,
        icon,
        trackerCount: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      
      // If starred is selected, add to schema
      if (starred) {
        (newCol as any).starred = true;
      }

      await CollectionRepository.createCollection(userId, newCol);
      
      setName("");
      setDescription("");
      setColor("#3B82F6");
      setIcon("folder");
      setStarred(false);
      setIsModalOpen(false);
      setSelectedId(collectionId);
    } catch (err: any) {
      setFormError(err.message || "Failed to create collection.");
    } finally {
      setSubmitting(false);
    }
  };

  const getIconComponent = (iconName: string, className = "h-5 w-5 text-white") => {
    switch (iconName) {
      case "briefcase": return <Briefcase className={className} />;
      case "dollar": return <DollarSign className={className} />;
      case "globe": return <Globe className={className} />;
      case "document": return <FileText className={className} />;
      default: return <FolderOpen className={className} />;
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 text-accent-primary animate-spin" />
        <p className="text-sm font-mono text-foreground-secondary">Loading collections...</p>
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
        className={`flex flex-1 min-w-0 flex-col gap-5 ${selected ? "pr-4" : ""}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Collections</h1>
            <p className="mt-1 text-sm text-foreground-secondary">
              Organize your trackers with collections. Group related trackers and monitor them together.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex h-9 shrink-0 items-center gap-2 rounded-xl bg-accent-purple px-4 text-sm font-semibold text-white hover:bg-accent-purple/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Collection
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((c) => (
            <div key={c.label} className="glass-card flex items-center gap-3 rounded-2xl p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: c.iconBg }}>
                <FolderOpen className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-[11px] text-foreground-secondary">{c.label}</p>
                <p className="text-xl font-bold text-foreground">{c.value}</p>
                <p className="text-[10px] text-foreground-muted">{c.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tab Bar + View Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {(["all", "favorites"] as TabFilter[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`relative px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  tab === t
                    ? "text-foreground border-b-2 border-accent-purple"
                    : "text-foreground-secondary hover:text-foreground"
                }`}
              >
                {t === "all" ? "All Collections" : "Favorites"}
              </button>
            ))}
          </div>
        </div>

        {/* Collection Grid */}
        {filteredCollections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center glass-card rounded-2xl p-8">
            <FolderOpen className="h-10 w-10 text-foreground-muted mb-3" />
            <p className="text-sm font-semibold text-foreground">No collections found</p>
            <p className="text-xs text-foreground-secondary mt-1 max-w-xs">
              {tab === "all" ? "Create a folder collection to organize your different tracking metrics." : "Mark collections as favorite to see them here."}
            </p>
            {tab === "all" && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-4 flex h-8 items-center gap-1.5 rounded-lg bg-accent-purple px-3 text-xs font-semibold text-white hover:bg-accent-purple/90"
              >
                <Plus className="h-3.5 w-3.5" /> New Collection
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCollections.map((col) => {
              const isSelected = col.id === selectedId;
              const count = trackersByCollection[col.id]?.length || 0;
              return (
                <motion.div
                  key={col.id}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setSelectedId(col.id)}
                  className={`glass-card relative cursor-pointer rounded-2xl p-5 transition-all ${
                    isSelected ? "border-accent-purple/40 bg-accent-purple/5" : ""
                  }`}
                >
                  {/* Star */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleStar(col);
                    }}
                    className={`absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg hover:bg-surface transition-colors ${(col as any).starred ? "text-yellow-500" : "text-foreground-muted"}`}
                  >
                    <Star className={`h-4 w-4 ${(col as any).starred ? "fill-yellow-500 text-yellow-500" : ""}`} />
                  </button>

                  {/* Icon */}
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: col.color || "#3B82F6" }}>
                    {getIconComponent(col.icon)}
                  </div>

                  <h3 className="mb-0.5 text-[14px] font-semibold text-foreground">{col.name}</h3>
                  <p className="mb-2 text-[12px] text-foreground-secondary">{count} trackers</p>
                  <p className="mb-3 text-[12px] text-foreground-muted leading-relaxed line-clamp-2">{col.description || "No description provided."}</p>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border-glass/30">
                    <span className="text-[10px] text-foreground-muted">
                      Created {col.createdAt ? new Date(col.createdAt.seconds * 1000).toLocaleDateString() : ""}
                    </span>
                  </div>
                </motion.div>
              );
            })}
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
            className="w-[290px] shrink-0 glass-card rounded-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="border-b border-border-glass p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-accent-purple uppercase tracking-wider">Collection Details</span>
                <button onClick={() => setSelectedId("")} className="flex h-6 w-6 items-center justify-center rounded text-foreground-muted hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: selected.color || "#3B82F6" }}>
                  {getIconComponent(selected.icon)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[14px] font-semibold text-foreground truncate">{selected.name}</h3>
                  </div>
                  <p className="text-[12px] text-foreground-secondary">{selectedTrackers.length} trackers</p>
                </div>
              </div>
              <p className="mt-2 text-[12px] text-foreground-secondary leading-relaxed">{selected.description || "No description."}</p>
            </div>

            {/* Trackers in Collection */}
            <div className="flex-1 overflow-y-auto p-4">
              <h4 className="mb-3 text-[13px] font-semibold text-foreground">Trackers in this collection</h4>
              {selectedTrackers.length === 0 ? (
                <p className="text-[11px] text-foreground-muted">No trackers assigned to this collection folder.</p>
              ) : (
                <div className="space-y-2.5">
                  {selectedTrackers.map((t) => (
                    <div key={t.id} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-elevated text-[10px] font-bold text-foreground">
                          {t.name[0]?.toUpperCase() || "T"}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[12px] font-medium text-foreground">{t.name}</p>
                          <p className="truncate text-[10px] text-foreground-muted">{t.url}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className={`h-1.5 w-1.5 rounded-full ${t.status === "active" ? "bg-success" : t.status === "paused" ? "bg-warning" : "bg-error"}`} />
                        <span className="text-[11px] capitalize text-foreground-secondary">{t.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="border-t border-border-glass p-3 flex gap-2">
              <button
                onClick={() => handleDeleteCollection(selected.id)}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-error/30 bg-error/10 py-2 text-error hover:bg-error/20 transition-colors text-xs font-semibold"
              >
                <Trash2 className="h-4 w-4" /> Delete Collection
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Framer Motion Custom Modal for Creation ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            {/* Dialog Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border-glass bg-background p-6 shadow-2xl z-10"
            >
              <button onClick={() => setIsModalOpen(false)} className="absolute right-4 top-4 text-foreground-muted hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
              <h3 className="text-lg font-bold text-foreground mb-1">Create Collection</h3>
              <p className="text-xs text-foreground-secondary mb-4">Create a folder folder to organize your trackers.</p>
              
              <form onSubmit={handleCreateCollection} className="space-y-4">
                {formError && (
                  <div className="rounded-lg border border-error/25 bg-error/10 p-2 text-xs font-semibold text-error">
                    {formError}
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-foreground-secondary">Collection Name *</label>
                  <input
                    type="text"
                    placeholder="Gadgets pricing, Career goals..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full rounded-xl border border-border-glass bg-bg-glass px-3 py-2.5 text-sm text-foreground placeholder:text-foreground-muted outline-none focus:border-accent-purple"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-foreground-secondary">Description</label>
                  <textarea
                    placeholder="Brief description of this folder group..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full rounded-xl border border-border-glass bg-bg-glass px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted outline-none focus:border-accent-purple resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Icon */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-foreground-secondary">Icon</label>
                    <select
                      value={icon}
                      onChange={(e) => setIcon(e.target.value)}
                      className="w-full h-10 rounded-xl border border-border-glass bg-[#18181b] px-3 text-sm text-foreground outline-none focus:border-accent-purple"
                    >
                      <option value="folder">📁 Folder</option>
                      <option value="briefcase">💼 Business</option>
                      <option value="dollar">💵 Financial</option>
                      <option value="globe">🌐 Web</option>
                      <option value="document">📄 Document</option>
                    </select>
                  </div>

                  {/* Colors */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-foreground-secondary">Theme Color</label>
                    <div className="flex flex-wrap gap-1.5 items-center h-10">
                      {AVAILABLE_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setColor(c)}
                          className={`h-5 w-5 rounded-full border transition-all ${color === c ? "border-white scale-110" : "border-transparent"}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Star toggle */}
                <div className="flex items-center gap-2 py-1 select-none">
                  <input
                    type="checkbox"
                    id="modalStarred"
                    checked={starred}
                    onChange={(e) => setStarred(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border border-border-glass bg-bg-glass text-accent-primary"
                  />
                  <label htmlFor="modalStarred" className="text-sm text-foreground-secondary cursor-pointer">
                    Add to favorites list
                  </label>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl border border-border-glass bg-bg-glass px-4 py-2 text-xs font-semibold text-foreground hover:bg-surface"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-accent-purple px-4 py-2 text-xs font-semibold text-white hover:bg-accent-purple/90"
                    disabled={submitting}
                  >
                    {submitting ? "Creating..." : "Create Folder"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
