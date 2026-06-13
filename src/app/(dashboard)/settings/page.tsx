"use client";

import React, { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/services/firebase";
import { useAuthStore } from "@/store/authStore";
import { UserRepository } from "@/services/firestore/users";
import { NotificationRepository } from "@/services/firestore/notifications";
import { UserPreferences, NotificationLog, ScanFrequency } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Timestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  Bell,
  Mail,
  MessageSquare,
  Check,
  AlertCircle,
  HelpCircle,
  Clock,
  User,
  ShieldAlert,
  Globe,
  Save,
  CheckCircle,
} from "lucide-react";

export default function SettingsPage() {
  const { profile } = useAuthStore();

  // Selected Tab state ("preferences" | "logs")
  const [activeTab, setActiveTab] = useState<"preferences" | "logs">("preferences");

  // Preferences Form Fields
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [telegramNotifications, setTelegramNotifications] = useState(false);
  const [telegramChatId, setTelegramChatId] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [defaultFrequency, setDefaultFrequency] = useState<ScanFrequency>("daily");
  const [theme, setTheme] = useState<"dark" | "light" | "system">("dark");

  // Notifications Feed Log Fields
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  
  // State flags
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user preferences on mount
  useEffect(() => {
    if (!profile?.id) return;

    setLoadingPrefs(true);
    UserRepository.getUserPreferences(profile.id)
      .then((prefs) => {
        if (prefs) {
          setEmailNotifications(prefs.emailNotifications);
          setTelegramNotifications(prefs.telegramNotifications);
          setTelegramChatId(prefs.telegramChatId || "");
          setTimezone(prefs.timezone || "UTC");
          setDefaultFrequency(prefs.defaultFrequency || "daily");
          setTheme(prefs.theme || "dark");
        }
        setError(null);
      })
      .catch((err) => {
        console.error("Failed to fetch preferences", err);
        setError("Failed to load user preferences.");
      })
      .finally(() => setLoadingPrefs(false));
  }, [profile]);

  // Set up real-time listener for user's notification logs (last 30 logs)
  useEffect(() => {
    if (!profile?.id) return;

    const q = query(
      collection(db, "users", profile.id, "notifications"),
      orderBy("createdAt", "desc"),
      limit(30)
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const list: NotificationLog[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            trackerId: data.trackerId ?? "",
            eventId: data.eventId ?? "",
            channel: data.channel ?? "email",
            status: data.status ?? "pending",
            read: data.read ?? false,
            sentAt: data.sentAt,
            createdAt: data.createdAt,
          });
        });
        setNotifications(list);
      },
      (err) => {
        console.error("Notification logs listener error", err);
      }
    );

    return () => unsubscribe();
  }, [profile]);

  // Save preferences
  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    setSavingPrefs(true);
    setSaveSuccess(false);
    setError(null);

    try {
      const updatedPrefs: UserPreferences = {
        theme,
        emailNotifications,
        telegramNotifications,
        telegramChatId: telegramChatId.trim() || undefined,
        defaultFrequency,
        timezone,
        updatedAt: Timestamp.now(),
      };

      await UserRepository.saveUserPreferences(profile.id, updatedPrefs);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error("Failed to save preferences", err);
      setError(err.message || "Failed to save settings.");
    } finally {
      setSavingPrefs(false);
    }
  };

  // Mark all logs as read
  const handleMarkAllRead = async () => {
    if (!profile?.id) return;
    try {
      await NotificationRepository.markAllAsRead(profile.id);
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  // Mark single log as read
  const handleMarkSingleRead = async (id: string) => {
    if (!profile?.id) return;
    try {
      await NotificationRepository.markAsRead(profile.id, id);
    } catch (err) {
      console.error("Failed to mark single read", err);
    }
  };

  // Mock Notification logs in case Firestore collections are empty
  const getDisplayNotifications = (): NotificationLog[] => {
    if (notifications.length > 0) return notifications;
    
    const baseDate = new Date();
    return [
      {
        id: "mock-n-1",
        trackerId: "track-1",
        eventId: "ev-1",
        channel: "email",
        status: "sent",
        read: false,
        sentAt: { toDate: () => new Date(baseDate.getTime() - 15 * 60000) } as any,
        createdAt: { toDate: () => new Date(baseDate.getTime() - 15 * 60000) } as any,
      },
      {
        id: "mock-n-2",
        trackerId: "track-2",
        eventId: "ev-2",
        channel: "telegram",
        status: "sent",
        read: false,
        sentAt: { toDate: () => new Date(baseDate.getTime() - 45 * 60000) } as any,
        createdAt: { toDate: () => new Date(baseDate.getTime() - 45 * 60000) } as any,
      },
      {
        id: "mock-n-3",
        trackerId: "track-1",
        eventId: "ev-3",
        channel: "email",
        status: "sent",
        read: true,
        sentAt: { toDate: () => new Date(baseDate.getTime() - 3 * 3600000) } as any,
        createdAt: { toDate: () => new Date(baseDate.getTime() - 3 * 3600000) } as any,
      },
      {
        id: "mock-n-4",
        trackerId: "track-3",
        eventId: "ev-4",
        channel: "telegram",
        status: "failed",
        read: true,
        sentAt: { toDate: () => new Date(baseDate.getTime() - 12 * 3600000) } as any,
        createdAt: { toDate: () => new Date(baseDate.getTime() - 12 * 3600000) } as any,
      },
    ];
  };

  const activeLogs = getDisplayNotifications();

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Settings & Notifications
        </h1>
        <p className="mt-1 text-sm text-foreground-secondary">
          Configure notification dispatch endpoints and inspect transmission histories.
        </p>
      </div>

      {/* Tabs Selection Bar */}
      <div className="flex border-b border-border-glass gap-2 pb-px select-none">
        <button
          onClick={() => setActiveTab("preferences")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === "preferences"
              ? "border-accent-primary text-foreground"
              : "border-transparent text-foreground-secondary hover:text-foreground"
          }`}
        >
          Alert Preferences
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === "logs"
              ? "border-accent-primary text-foreground"
              : "border-transparent text-foreground-secondary hover:text-foreground"
          }`}
        >
          Dispatch Logs
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-error/25 bg-error/10 p-4 text-sm font-semibold text-error">
          {error}
        </div>
      )}

      {/* Dynamic Tabs Content */}
      <AnimatePresence mode="wait">
        {activeTab === "preferences" ? (
          <motion.div
            key="preferences"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {loadingPrefs ? (
              // Loader Skeletons
              <div className="space-y-6 animate-pulse">
                <div className="h-[200px] bg-surface-elevated rounded-3xl" />
                <div className="h-[250px] bg-surface-elevated rounded-3xl" />
              </div>
            ) : (
              <form onSubmit={handleSavePreferences} className="space-y-6">
                {/* 1. Email Preferences Card */}
                <Card>
                  <CardHeader className="p-6">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Mail className="h-5 w-5 text-accent-primary" /> Email Notifications
                    </CardTitle>
                    <CardDescription>
                      Receive automated details of scraped changes directly inside your email inbox.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-6 pb-6 pt-0 space-y-4">
                    <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border-glass bg-white/[0.01]">
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold text-foreground">Enable Email Alerts</p>
                        <p className="text-xs text-foreground-secondary">
                          Sends single delta summaries on detected page changes.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                        className="h-5 w-5 rounded border border-border-glass bg-bg-glass text-accent-primary focus:ring-accent-primary cursor-pointer"
                        disabled={savingPrefs}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* 2. Telegram Preferences Card */}
                <Card>
                  <CardHeader className="p-6">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-accent-cyan" /> Telegram Alert Bot
                    </CardTitle>
                    <CardDescription>
                      Route instant crawler alerts to your mobile Telegram chat.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-6 pb-6 pt-0 space-y-5">
                    {/* Toggle */}
                    <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border-glass bg-white/[0.01]">
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold text-foreground">Enable Telegram Alerts</p>
                        <p className="text-xs text-foreground-secondary">
                          Relay instant notification messages via our verified Telegram Bot.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={telegramNotifications}
                        onChange={(e) => setTelegramNotifications(e.target.checked)}
                        className="h-5 w-5 rounded border border-border-glass bg-bg-glass text-accent-primary focus:ring-accent-primary cursor-pointer"
                        disabled={savingPrefs}
                      />
                    </div>

                    {/* Telegram Chat ID */}
                    <AnimatePresence>
                      {telegramNotifications && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-4 pt-1"
                        >
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold font-mono tracking-wider uppercase text-foreground-secondary">
                              Telegram Chat ID *
                            </label>
                            <Input
                              placeholder="e.g. 1847294827"
                              value={telegramChatId}
                              onChange={(e) => setTelegramChatId(e.target.value)}
                              required={telegramNotifications}
                              disabled={savingPrefs}
                            />
                          </div>

                          {/* How to Setup Walkthrough Guide */}
                          <div className="rounded-2xl border border-accent-cyan/15 bg-accent-cyan/[0.02] p-4 flex gap-3.5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 h-20 w-20 bg-accent-cyan/5 rounded-bl-full blur-xl" />
                            <HelpCircle className="h-5 w-5 text-accent-cyan shrink-0 mt-0.5" />
                            <div className="space-y-1.5 text-xs text-foreground-secondary">
                              <h5 className="font-bold text-foreground">How to configure Telegram notifications:</h5>
                              <ol className="list-decimal pl-4 space-y-1 leading-relaxed">
                                <li>Open Telegram and search for the verified bot name: <span className="font-mono text-accent-cyan font-semibold select-all">@TraxoAlertBot</span></li>
                                <li>Send a message saying <span className="font-mono bg-bg-glass px-1 py-0.5 rounded border border-border-glass font-semibold text-foreground">/start</span> to the bot conversation.</li>
                                <li>The bot will respond with your unique **Telegram Chat ID**. Copy it.</li>
                                <li>Paste the numeric ID into the Chat ID box above, and save settings.</li>
                              </ol>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>

                {/* 3. General Preferences Card */}
                <Card>
                  <CardHeader className="p-6">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Settings className="h-5 w-5 text-accent-purple" /> General Settings
                    </CardTitle>
                    <CardDescription>
                      Configure account timezones, dark themes, and crawler defaults.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-6 pb-6 pt-0 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Theme selection */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold font-mono tracking-wider uppercase text-foreground-secondary">
                          App Theme
                        </label>
                        <select
                          value={theme}
                          onChange={(e) => setTheme(e.target.value as any)}
                          className="flex h-[52px] w-full rounded-xl border border-border-glass bg-bg-glass px-4 text-sm text-foreground outline-none focus:bg-surface focus:border-accent-primary"
                          disabled={savingPrefs}
                        >
                          <option value="dark">Luxurious Dark</option>
                          <option value="light">Crisp Light</option>
                          <option value="system">Follow System</option>
                        </select>
                      </div>

                      {/* Timezone selection */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold font-mono tracking-wider uppercase text-foreground-secondary">
                          Timezone
                        </label>
                        <select
                          value={timezone}
                          onChange={(e) => setTimezone(e.target.value)}
                          className="flex h-[52px] w-full rounded-xl border border-border-glass bg-bg-glass px-4 text-sm text-foreground outline-none focus:bg-surface focus:border-accent-primary"
                          disabled={savingPrefs}
                        >
                          <option value="UTC">UTC (GMT+0)</option>
                          <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                          <option value="America/New_York">America/New_York (EST)</option>
                          <option value="Europe/London">Europe/London (GMT)</option>
                        </select>
                      </div>

                      {/* Default scan frequency */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold font-mono tracking-wider uppercase text-foreground-secondary">
                          Default Scan Rate
                        </label>
                        <select
                          value={defaultFrequency}
                          onChange={(e) => setDefaultFrequency(e.target.value as ScanFrequency)}
                          className="flex h-[52px] w-full rounded-xl border border-border-glass bg-bg-glass px-4 text-sm text-foreground outline-none focus:bg-surface focus:border-accent-primary"
                          disabled={savingPrefs}
                        >
                          <option value="hourly">Hourly Scans</option>
                          <option value="6h">Every 6 Hours</option>
                          <option value="12h">Every 12 Hours</option>
                          <option value="daily">Daily Scans</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Submit button bar */}
                <div className="flex items-center gap-3 justify-end pt-2">
                  <AnimatePresence>
                    {saveSuccess && (
                      <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="flex items-center gap-1 text-xs font-semibold text-success"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Settings saved successfully!</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Button
                    type="submit"
                    className="flex items-center gap-2 h-11 px-5 rounded-xl font-semibold"
                    disabled={savingPrefs}
                  >
                    <Save className="h-4 w-4" />
                    <span>{savingPrefs ? "Saving..." : "Save Preferences"}</span>
                  </Button>
                </div>
              </form>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="logs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-foreground-secondary">
                Transmission Logs Feed ({activeLogs.length})
              </h3>
              
              {activeLogs.filter((n) => !n.read).length > 0 && (
                <Button
                  variant="secondary"
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1.5 text-xs h-8 px-2.5 rounded-lg text-accent-primary border-accent-primary/20 bg-accent-primary/5"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Mark all read</span>
                </Button>
              )}
            </div>

            {/* Notification logs Feed list */}
            <div className="flex flex-col gap-3">
              {activeLogs.map((log) => {
                const date = log.createdAt.toDate ? log.createdAt.toDate() : new Date();
                
                return (
                  <div
                    key={log.id}
                    className={`group rounded-2xl border p-4 flex items-center justify-between gap-4 transition-all duration-300 ${
                      log.read
                        ? "border-border-glass bg-bg-glass/40 hover:bg-surface-elevated/10"
                        : "border-accent-primary/20 bg-accent-primary/5 hover:bg-accent-primary/10"
                    }`}
                  >
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      {/* Visual Channel icon */}
                      <div className={`flex h-9 w-9 items-center justify-center rounded-xl border shrink-0 mt-0.5 ${
                        log.channel === "email"
                          ? "bg-accent-primary/10 border-accent-primary/20 text-accent-primary"
                          : "bg-accent-cyan/10 border-accent-cyan/20 text-accent-cyan"
                      }`}>
                        {log.channel === "email" ? (
                          <Mail className="h-4.5 w-4.5" />
                        ) : (
                          <MessageSquare className="h-4.5 w-4.5" />
                        )}
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xs font-mono font-bold uppercase tracking-wider text-foreground-secondary">
                            {log.channel} dispatch
                          </span>
                          <span className="text-[10px] text-foreground-muted font-mono">
                            &bull; {date.toLocaleString()}
                          </span>
                        </div>
                        
                        <p className="text-sm font-bold text-foreground leading-snug">
                          {log.channel === "email" ? "Crawler change summary dispatched via SMTP" : "Crawler change relay sent to Telegram client"}
                        </p>
                        
                        <div className="flex items-center gap-2.5 mt-2">
                          <span className={`rounded border px-1.5 py-0.5 text-[8px] font-mono font-bold uppercase tracking-wider ${
                            log.status === "sent" ? "bg-success/10 border-success/25 text-success" :
                            log.status === "failed" ? "bg-error/10 border-error/25 text-error" :
                            "bg-foreground-muted/10 border-border-glass text-foreground-secondary"
                          }`}>
                            {log.status}
                          </span>
                          <span className="text-[10px] text-foreground-secondary truncate">
                            Tracker ID: <span className="font-mono text-[9px]">{log.trackerId}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Unread dot toggle action */}
                    {!log.read && (
                      <button
                        type="button"
                        onClick={() => handleMarkSingleRead(log.id)}
                        className="h-8 w-8 rounded-lg border border-border-glass bg-bg-glass text-foreground-secondary flex items-center justify-center hover:text-foreground hover:bg-surface-elevated hover:scale-[1.05] transition-all shrink-0 cursor-pointer"
                        title="Mark Read"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
