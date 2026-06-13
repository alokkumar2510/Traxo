"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link2,
  Webhook,
  Send,
  TrendingUp,
  Settings,
  Copy,
  Plus,
  Clock,
  Trash2,
  CheckCircle,
  AlertCircle,
  Mail,
  MessageCircle,
} from "lucide-react";
import { db } from "@/services/firebase";
import { useAuthStore } from "@/store/authStore";
import { collection, query, onSnapshot, doc, setDoc, deleteDoc } from "firebase/firestore";

interface WebhookItem {
  id: string;
  name?: string;
  url: string;
  platform: "discord" | "slack" | "custom";
  events: string[];
  active: boolean;
}

export default function IntegrationsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const userId = user?.uid;

  // Real-time states
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [preferences, setPreferences] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Add Webhook Form Modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [whName, setWhName] = useState("");
  const [whUrl, setWhUrl] = useState("");
  const [whPlatform, setWhPlatform] = useState<"custom" | "slack" | "discord">("custom");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 1. Subscribe to webhooks
  useEffect(() => {
    if (!userId) return;

    const q = collection(db, "users", userId, "webhooks");
    const unsub = onSnapshot(q, (snap) => {
      const list: WebhookItem[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({ id: docSnap.id, ...data } as WebhookItem);
      });
      setWebhooks(list);
      setLoading(false);
    });

    return () => unsub();
  }, [userId]);

  // 2. Subscribe to user preferences
  useEffect(() => {
    if (!userId) return;

    const unsub = onSnapshot(doc(db, "users", userId, "preferences", "default"), (snap) => {
      if (snap.exists()) {
        setPreferences(snap.data());
      }
    });

    return () => unsub();
  }, [userId]);

  // 3. Subscribe to analytics
  useEffect(() => {
    if (!userId) return;

    const unsub = onSnapshot(doc(db, "analytics", userId), (snap) => {
      if (snap.exists()) {
        setAnalytics(snap.data());
      }
    });

    return () => unsub();
  }, [userId]);

  // Dynamic connection maps
  const integrationsList = useMemo(() => {
    const hasSlackWebhook = webhooks.some((w) => w.platform === "slack" && w.active);
    const hasDiscordWebhook = webhooks.some((w) => w.platform === "discord" && w.active);
    const hasGenericWebhook = webhooks.some((w) => w.platform === "custom" && w.active);
    const hasEmail = preferences?.emailNotifications === true;
    const hasTelegram = preferences?.telegramNotifications === true && preferences?.telegramChatId;

    return [
      {
        id: "slack",
        name: "Slack",
        desc: "Receive alerts and updates in your Slack channels",
        icon: "S",
        iconBg: "#4A154B",
        iconColor: "#E01E5A",
        connected: hasSlackWebhook,
        managePath: "#webhooks",
      },
      {
        id: "email",
        name: "Email Notifications",
        desc: "Get updates directly in your inbox",
        icon: "✉",
        iconBg: "#2563EB",
        iconColor: "#fff",
        connected: hasEmail,
        managePath: "/settings?tab=notifications",
      },
      {
        id: "telegram",
        name: "Telegram Bot",
        desc: "Receive alerts on your Telegram channels",
        icon: "✈",
        iconBg: "#0088CC",
        iconColor: "#fff",
        connected: !!hasTelegram,
        managePath: "/settings?tab=notifications",
      },
      {
        id: "discord",
        name: "Discord Embeds",
        desc: "Get notified in your Discord servers",
        icon: "D",
        iconBg: "#5865F2",
        iconColor: "#fff",
        connected: hasDiscordWebhook,
        managePath: "#webhooks",
      },
      {
        id: "webhook",
        name: "Custom Webhooks",
        desc: "Send real-time JSON payloads to your endpoint",
        icon: "⚡",
        iconBg: "#18181B",
        iconColor: "#fff",
        connected: hasGenericWebhook,
        managePath: "#webhooks",
      },
    ];
  }, [webhooks, preferences]);

  // Statistics calculation
  const stats = useMemo(() => {
    const activeCount = integrationsList.filter((i) => i.connected).length;
    return {
      activeCount,
      webhooksCount: webhooks.length,
      notificationsSent: analytics?.notificationsSent ?? 0,
      successRate: analytics ? Math.round((analytics.successfulScans / (analytics.successfulScans + analytics.failedScans || 1)) * 100) : 100,
    };
  }, [integrationsList, webhooks, analytics]);

  // Handle create webhook
  const handleAddWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !whUrl.trim()) return;

    try {
      setSubmitting(true);
      setErrorMsg(null);

      const newId = `wh-${Date.now()}`;
      const payload: WebhookItem = {
        id: newId,
        name: whName.trim() || `${whPlatform.toUpperCase()} Webhook`,
        url: whUrl.trim(),
        platform: whPlatform,
        events: ["new_job", "price_drop", "price_increase", "pdf_updated", "content_changed", "content_added", "content_removed"],
        active: true,
      };

      await setDoc(doc(db, "users", userId, "webhooks", newId), payload);
      
      setWhName("");
      setWhUrl("");
      setWhPlatform("custom");
      setIsAddOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save webhook.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete webhook
  const handleDeleteWebhook = async (whId: string) => {
    if (!userId) return;
    try {
      await deleteDoc(doc(db, "users", userId, "webhooks", whId));
    } catch (err) {
      console.error("Failed to delete webhook:", err);
    }
  };

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Clock className="h-8 w-8 text-accent-primary animate-spin" />
        <p className="text-sm font-mono text-foreground-secondary">Syncing integration bindings...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Integrations</h1>
          <p className="mt-1 text-sm text-foreground-secondary">
            Connect Traxo with your favorite team notification services.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex h-9 items-center gap-2 rounded-xl bg-accent-purple px-4 text-[12px] font-semibold text-white hover:bg-accent-purple/90 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Connect Webhook</span>
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Connected integrations */}
        <div className="glass-card flex flex-col justify-between rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-500">
              <Link2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[11px] text-foreground-secondary">Active Integrations</p>
              <p className="text-xl font-bold text-foreground">{stats.activeCount}</p>
              <p className="text-[10px] text-foreground-muted">Channels connected</p>
            </div>
          </div>
        </div>

        {/* Webhooks Count */}
        <div className="glass-card flex flex-col justify-between rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-600 to-emerald-500">
              <Webhook className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[11px] text-foreground-secondary">Webhooks</p>
              <p className="text-xl font-bold text-foreground">{stats.webhooksCount}</p>
              <p className="text-[10px] text-foreground-muted">Active URLs</p>
            </div>
          </div>
        </div>

        {/* Alerts Dispatched */}
        <div className="glass-card flex flex-col justify-between rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500">
              <Send className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[11px] text-foreground-secondary">Notifications Sent</p>
              <p className="text-xl font-bold text-foreground">{stats.notificationsSent}</p>
              <p className="text-[10px] text-foreground-muted">Total sweeps alerts</p>
            </div>
          </div>
        </div>

        {/* Sweep health */}
        <div className="glass-card flex flex-col justify-between rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-600 to-yellow-500">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[11px] text-foreground-secondary">Scans Health</p>
              <p className="text-xl font-bold text-foreground">{stats.successRate}%</p>
              <p className="text-[10px] text-foreground-muted">Success rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left: Active Integrations */}
        <div className="glass-card rounded-2xl overflow-hidden flex flex-col">
          <div className="border-b border-border-glass px-5 py-4">
            <h3 className="text-[15px] font-semibold text-foreground">Channels & Integrations</h3>
          </div>
          <div className="divide-y divide-border-glass/50 flex-1">
            {integrationsList.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-4 px-5 py-4"
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[13px] font-bold"
                  style={{ background: item.iconBg, color: item.iconColor }}
                >
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-foreground">{item.name}</p>
                  <p className="truncate text-[11px] text-foreground-secondary">{item.desc}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {item.connected ? (
                    <span className="rounded-lg border border-success/30 bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success">
                      Connected
                    </span>
                  ) : (
                    <span className="rounded-lg border border-border-glass bg-surface px-2.5 py-1 text-[11px] font-semibold text-foreground-secondary">
                      Disconnected
                    </span>
                  )}
                  <button
                    onClick={() => {
                      if (item.managePath.startsWith("#")) {
                        const el = document.getElementById(item.managePath.replace("#", ""));
                        el?.scrollIntoView({ behavior: "smooth" });
                      } else {
                        router.push(item.managePath);
                      }
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-border-glass bg-bg-glass px-2.5 py-1 text-[11px] font-medium text-foreground-secondary hover:text-foreground transition-colors cursor-pointer"
                  >
                    <Settings className="h-3 w-3" />
                    <span>Manage</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right: Webhooks Endpoints list */}
        <div id="webhooks" className="glass-card rounded-2xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between border-b border-border-glass px-4 py-3">
            <h3 className="text-[14px] font-semibold text-foreground">Webhook Endpoints</h3>
            <button
              onClick={() => setIsAddOpen(true)}
              className="text-[11px] text-accent-primary hover:opacity-80 cursor-pointer"
            >
              Add New
            </button>
          </div>
          <div className="divide-y divide-border-glass/50 flex-1 overflow-y-auto max-h-[400px]">
            {webhooks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <Webhook className="h-8 w-8 text-foreground-muted/40 mb-2" />
                <span className="text-[11px] text-foreground-secondary font-medium">No webhook URLs connected</span>
                <span className="text-[10px] text-foreground-muted max-w-[160px] mt-0.5">
                  Route change alerts directly into custom servers, Slack, or Discord.
                </span>
              </div>
            ) : (
              webhooks.map((wh) => (
                <div key={wh.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-foreground truncate">{wh.name || "Webhook URL"}</p>
                    <p className="truncate text-[10px] text-foreground-muted font-mono">{wh.url}</p>
                    <span className="inline-block mt-1 rounded bg-bg-glass border border-border-glass px-1 py-0.2 text-[8px] font-mono text-accent-cyan uppercase">
                      {wh.platform}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => handleCopyUrl(wh.url, wh.id)}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-border-glass text-foreground-muted hover:text-foreground cursor-pointer"
                    title="Copy URL"
                  >
                    {copiedId === wh.id ? "✓" : <Copy className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => handleDeleteWebhook(wh.id)}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-error/20 bg-error/5 text-error hover:bg-error/15 cursor-pointer"
                    title="Delete webhook"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Webhook Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl border border-border-glass bg-surface p-6 shadow-2xl space-y-4"
          >
            <div>
              <h3 className="text-lg font-bold text-foreground">Connect Webhook</h3>
              <p className="text-xs text-foreground-secondary mt-0.5">
                Configure a server or channel endpoint to dispatch real-time change logs.
              </p>
            </div>

            {errorMsg && (
              <div className="rounded-lg border border-error/20 bg-error/10 p-3 text-xs text-error font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleAddWebhook} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-foreground-secondary">
                  Integration Platform
                </label>
                <select
                  value={whPlatform}
                  onChange={(e) => setWhPlatform(e.target.value as any)}
                  className="flex h-10 w-full rounded-lg border border-border-glass bg-bg-glass px-3 text-xs text-foreground outline-none focus:bg-surface focus:border-accent-primary cursor-pointer"
                >
                  <option value="custom">Generic JSON POST Webhook</option>
                  <option value="slack">Slack Channel Webhook</option>
                  <option value="discord">Discord Channel Webhook</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-foreground-secondary">
                  Webhook Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Production Alerts"
                  value={whName}
                  onChange={(e) => setWhName(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-border-glass bg-bg-glass px-3 text-xs text-foreground outline-none focus:bg-surface focus:border-accent-primary"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-foreground-secondary">
                  Target Endpoint URL
                </label>
                <input
                  type="url"
                  placeholder="https://yourdomain.com/webhook"
                  value={whUrl}
                  onChange={(e) => setWhUrl(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-border-glass bg-bg-glass px-3 text-xs text-foreground outline-none focus:bg-surface focus:border-accent-primary"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-foreground-secondary hover:text-foreground bg-surface rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-accent-purple hover:bg-accent-purple/90 rounded-lg transition-colors cursor-pointer"
                >
                  {submitting ? "Connecting..." : "Add Webhook"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
