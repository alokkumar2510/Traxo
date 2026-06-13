"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useAuthStore } from "@/store/authStore";
import { db } from "@/services/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  increment,
  runTransaction,
  Timestamp,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Sparkles,
  Layers,
  Activity,
  Plus,
  ArrowRight,
  TrendingUp,
  Globe,
  DollarSign,
  Briefcase,
  GraduationCap,
  BookmarkCheck,
  Bookmark,
  Share2,
  AlertCircle,
  Clock,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PublicTracker {
  id: string;
  creatorId: string;
  name: string;
  description: string;
  category: "jobs" | "prices" | "education" | "government";
  subscriberCount: number;
  sourceUrl: string;
  active: boolean;
  createdAt: any;
}

export default function MarketplacePage() {
  const { user } = useAuthStore();
  const userId = user?.uid;

  // State
  const [publicTrackers, setPublicTrackers] = useState<PublicTracker[]>([]);
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  // Dialog Creation State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTrackerName, setNewTrackerName] = useState("");
  const [newTrackerDesc, setNewTrackerDesc] = useState("");
  const [newTrackerUrl, setNewTrackerUrl] = useState("");
  const [newTrackerCategory, setNewTrackerCategory] = useState<"jobs" | "prices" | "education" | "government">("jobs");
  const [publishing, setPublishing] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  // Fallback seed data if Firestore is empty
  const mockPublicTrackers: PublicTracker[] = [
    {
      id: "pub-1",
      creatorId: "admin",
      name: "Google Careers Watcher",
      description: "Monitors Software Engineer Internship roles in India and APAC locations.",
      category: "jobs",
      subscriberCount: 342,
      sourceUrl: "https://careers.google.com/jobs/results/",
      active: true,
      createdAt: Timestamp.now(),
    },
    {
      id: "pub-2",
      creatorId: "admin",
      name: "MacBook Pro M4 Price Drop",
      description: "Tracks Amazon India listings for MacBook Air and Pro lowest prices.",
      category: "prices",
      subscriberCount: 891,
      sourceUrl: "https://www.amazon.in/dp/B0DGDZ7GZD",
      active: true,
      createdAt: Timestamp.now(),
    },
    {
      id: "pub-3",
      creatorId: "admin",
      name: "VSSUT Examination Portal",
      description: "Tracks university notice boards for exam timetables and syllabus shifts.",
      category: "education",
      subscriberCount: 142,
      sourceUrl: "https://www.vssut.ac.in/",
      active: true,
      createdAt: Timestamp.now(),
    },
    {
      id: "pub-4",
      creatorId: "admin",
      name: "India Govt Job Portal",
      description: "Monitors national government job updates and UPSC vacancy announcements.",
      category: "government",
      subscriberCount: 521,
      sourceUrl: "https://www.ncs.gov.in/",
      active: true,
      createdAt: Timestamp.now(),
    },
  ];

  // Load Marketplace
  useEffect(() => {
    if (!userId) return;

    const loadMarketplace = async () => {
      try {
        setLoading(true);
        // 1. Fetch public trackers
        const trackersRef = collection(db, "marketplace", "publicTrackers");
        const trackersSnap = await getDocs(trackersRef);
        
        let fetchedTrackers: PublicTracker[] = [];
        if (!trackersSnap.empty) {
          fetchedTrackers = trackersSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as PublicTracker[];
        } else {
          // Seed mock data if database is empty for visual demonstration
          fetchedTrackers = mockPublicTrackers;
          // Create them in Firestore so they persist
          for (const item of mockPublicTrackers) {
            await setDoc(doc(db, "marketplace", "publicTrackers", item.id), item);
          }
        }
        setPublicTrackers(fetchedTrackers);

        // 2. Fetch user subscriptions
        const subsRef = collection(db, "users", userId, "subscriptions");
        const subsSnap = await getDocs(subsRef);
        if (!subsSnap.empty) {
          setSubscriptions(subsSnap.docs.map((doc) => doc.id));
        }
      } catch (err) {
        console.error("Failed to load marketplace catalog:", err);
      } finally {
        setLoading(false);
      }
    };

    loadMarketplace();
  }, [userId]);

  // Subscribe Action
  const toggleSubscribe = async (trackerId: string) => {
    if (!userId) return;

    const isSubscribed = subscriptions.includes(trackerId);

    try {
      const subDocRef = doc(db, "users", userId, "subscriptions", trackerId);
      const trackerDocRef = doc(db, "marketplace", "publicTrackers", trackerId);

      if (isSubscribed) {
        // Unsubscribe
        await deleteDoc(subDocRef);
        await updateDoc(trackerDocRef, {
          subscriberCount: increment(-1),
        });
        setSubscriptions((prev) => prev.filter((id) => id !== trackerId));
        setPublicTrackers((prev) =>
          prev.map((t) => (t.id === trackerId ? { ...t, subscriberCount: t.subscriberCount - 1 } : t))
        );
      } else {
        // Subscribe
        await setDoc(subDocRef, {
          publicTrackerId: trackerId,
          subscribedAt: Timestamp.now(),
        });
        await updateDoc(trackerDocRef, {
          subscriberCount: increment(1),
        });
        setSubscriptions((prev) => [...prev, trackerId]);
        setPublicTrackers((prev) =>
          prev.map((t) => (t.id === trackerId ? { ...t, subscriberCount: t.subscriberCount + 1 } : t))
        );
      }
    } catch (err) {
      console.error("Failed to toggle subscription:", err);
    }
  };

  // Publish a new Tracker
  const handlePublishTracker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    if (!newTrackerName || !newTrackerDesc || !newTrackerUrl) {
      setDialogError("All fields are required.");
      return;
    }

    try {
      setPublishing(true);
      const newId = `pub-${Date.now()}`;
      const newPub: PublicTracker = {
        id: newId,
        creatorId: userId,
        name: newTrackerName.trim(),
        description: newTrackerDesc.trim(),
        category: newTrackerCategory,
        subscriberCount: 0,
        sourceUrl: newTrackerUrl.trim(),
        active: true,
        createdAt: Timestamp.now(),
      };

      await setDoc(doc(db, "marketplace", "publicTrackers", newId), newPub);
      setPublicTrackers((prev) => [newPub, ...prev]);
      
      // Auto-subscribe creator
      await setDoc(doc(db, "users", userId, "subscriptions", newId), {
        publicTrackerId: newId,
        subscribedAt: Timestamp.now(),
      });
      setSubscriptions((prev) => [...prev, newId]);

      // Reset
      setNewTrackerName("");
      setNewTrackerDesc("");
      setNewTrackerUrl("");
      setIsDialogOpen(false);
      setDialogError(null);
    } catch (err: any) {
      setDialogError(err.message || "Failed to publish tracker.");
    } finally {
      setPublishing(false);
    }
  };

  // Filter trackers
  const filteredTrackers = useMemo(() => {
    return publicTrackers.filter((t) => {
      const matchesSearch =
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === "all" || t.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [publicTrackers, searchQuery, activeCategory]);

  const categoryIcons: Record<string, React.ReactNode> = {
    jobs: <Briefcase className="h-4 w-4" />,
    prices: <DollarSign className="h-4 w-4" />,
    education: <GraduationCap className="h-4 w-4" />,
    government: <Globe className="h-4 w-4" />,
  };

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Watchers Marketplace
          </h1>
          <p className="mt-1 text-sm text-foreground-secondary">
            Discover and subscribe to pre-configured public trackers built by the community.
          </p>
        </div>

        <Button
          onClick={() => setIsDialogOpen(true)}
          className="gradient-bg-primary hover:shadow-[0_0_20px_rgba(59,130,246,0.35)] text-white px-5 h-11"
        >
          <Plus className="h-4 w-4" />
          <span>Publish Tracker</span>
        </Button>
      </div>

      {/* Stats Widget */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-bg-glass border-border-glass">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-accent-primary/10 border border-accent-primary/20 text-accent-primary flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-mono text-foreground-secondary">Marketplace Size</p>
              <h3 className="text-2xl font-bold font-mono text-foreground">{publicTrackers.length} Watchers</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-bg-glass border-border-glass">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-accent-purple/10 border border-accent-purple/20 text-accent-purple flex items-center justify-center">
              <BookmarkCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-mono text-foreground-secondary">Your Subscriptions</p>
              <h3 className="text-2xl font-bold font-mono text-foreground">{subscriptions.length} Subbed</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-bg-glass border-border-glass">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan flex items-center justify-center">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-mono text-foreground-secondary">Community Reach</p>
              <h3 className="text-2xl font-bold font-mono text-foreground">
                {publicTrackers.reduce((acc, curr) => acc + curr.subscriberCount, 0).toLocaleString()} Users
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center border-b border-border-glass pb-4">
        {/* Category buttons */}
        <div className="flex flex-wrap gap-1.5 order-2 md:order-1">
          {["all", "jobs", "prices", "education", "government"].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-lg border transition-all cursor-pointer ${
                activeCategory === cat
                  ? "bg-accent-primary border-accent-primary text-white shadow-sm"
                  : "bg-bg-glass border-border-glass text-foreground-secondary hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:max-w-xs order-1 md:order-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
          <input
            type="text"
            placeholder="Search public listings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 rounded-lg border border-border-glass bg-bg-glass pl-9 pr-4 text-xs text-foreground placeholder-foreground-muted outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/30"
          />
        </div>
      </div>

      {/* Cards Catalog */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Clock className="h-8 w-8 text-accent-primary animate-spin" />
          <p className="text-xs font-mono text-foreground-secondary">Fetching marketplace feeds...</p>
        </div>
      ) : filteredTrackers.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border-glass rounded-2xl">
          <Globe className="mx-auto h-12 w-12 text-foreground-muted mb-4" />
          <h3 className="text-sm font-bold text-foreground">No listings match filters</h3>
          <p className="text-xs text-foreground-secondary mt-1">
            Be the first to publish a public watcher in this category!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTrackers.map((t) => {
            const isSubbed = subscriptions.includes(t.id);
            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={t.id}
                className="glass-card rounded-2xl p-6 flex flex-col justify-between gap-5 relative overflow-hidden"
              >
                {/* Accent glow on subscribed */}
                {isSubbed && (
                  <div className="absolute top-0 right-0 h-[3px] w-20 bg-success shadow-[0_0_8px_rgba(34,197,95,0.7)]" />
                )}

                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-surface-elevated flex items-center justify-center border border-border-glass text-foreground-secondary">
                        {categoryIcons[t.category] ?? <Globe className="h-4 w-4" />}
                      </div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-accent-primary">
                        {t.category}
                      </span>
                    </div>

                    <a
                      href={t.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground-muted hover:text-foreground transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>

                  <h4 className="text-base font-bold text-foreground">{t.name}</h4>
                  <p className="text-xs text-foreground-secondary leading-relaxed line-clamp-2">
                    {t.description}
                  </p>
                </div>

                <div className="flex justify-between items-center border-t border-border-glass pt-4 mt-1">
                  <div className="flex items-center gap-1.5 text-xs text-foreground-secondary font-mono">
                    <BookmarkCheck className="h-4 w-4 text-foreground-muted" />
                    <span>{t.subscriberCount} Subscribers</span>
                  </div>

                  <Button
                    variant={isSubbed ? "secondary" : "default"}
                    onClick={() => toggleSubscribe(t.id)}
                    className="h-8 px-3 rounded-lg text-xs"
                  >
                    {isSubbed ? "Subscribed" : "Subscribe"}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Publish Dialog Backdrop */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl border border-border-glass bg-surface p-6 shadow-2xl space-y-4"
          >
            <div>
              <h3 className="text-lg font-bold text-foreground">Publish Public Watcher</h3>
              <p className="text-xs text-foreground-secondary mt-0.5">
                Share your crawler configurations to the public marketplace.
              </p>
            </div>

            {dialogError && (
              <div className="rounded-lg border border-error/20 bg-error/10 p-3 text-xs text-error font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{dialogError}</span>
              </div>
            )}

            <form onSubmit={handlePublishTracker} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-foreground-secondary">
                  Watcher Name
                </label>
                <Input
                  placeholder="e.g. Stripe API Release Watcher"
                  value={newTrackerName}
                  onChange={(e) => setNewTrackerName(e.target.value)}
                  maxLength={50}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-foreground-secondary">
                  Description
                </label>
                <textarea
                  placeholder="Describe what content changes are tracked..."
                  value={newTrackerDesc}
                  onChange={(e) => setNewTrackerDesc(e.target.value)}
                  className="flex min-h-[80px] w-full rounded-xl border border-border-glass bg-bg-glass px-4 py-3 text-xs text-foreground outline-none focus:bg-surface focus:border-accent-primary"
                  maxLength={150}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-foreground-secondary">
                  Website URL
                </label>
                <Input
                  type="url"
                  placeholder="https://example.com"
                  value={newTrackerUrl}
                  onChange={(e) => setNewTrackerUrl(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-foreground-secondary">
                  Category
                </label>
                <select
                  value={newTrackerCategory}
                  onChange={(e) => setNewTrackerCategory(e.target.value as any)}
                  className="flex h-10 w-full rounded-lg border border-border-glass bg-bg-glass px-3 text-xs text-foreground outline-none focus:bg-surface focus:border-accent-primary"
                >
                  <option value="jobs">Jobs & Hiring</option>
                  <option value="prices">Prices & Shopping</option>
                  <option value="education">Education & Colleges</option>
                  <option value="government">Government Notices</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" onClick={() => setIsDialogOpen(false)} type="button">
                  Cancel
                </Button>
                <Button type="submit" disabled={publishing} className="gradient-bg-primary text-white">
                  {publishing ? "Publishing..." : "Publish Watcher"}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
