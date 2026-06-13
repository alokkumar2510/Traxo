"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  User,
  Bell,
  CreditCard,
  Shield,
  Code2,
  Database,
  Palette,
  Globe,
  Sliders,
  ChevronRight,
  Camera,
  Sun,
  Moon,
  LogOut,
  HelpCircle,
  Trash2,
  AlertTriangle,
  Key,
  Eye,
  EyeOff,
  Copy,
  Plus,
  Check,
  Download,
  AlertCircle,
  RefreshCw,
  Smartphone,
  Laptop,
  Globe2,
  ShieldAlert,
  CheckCircle,
  Users,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  writeBatch,
} from "firebase/firestore";
import { db, auth } from "@/services/firebase";
import { updatePassword, updateProfile, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";

// ─── Nav Items ──────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "general", label: "General", icon: Settings },
  { id: "profile", label: "Profile", icon: User },
  { id: "team", label: "Team", icon: Users },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "billing", label: "Billing & Plan", icon: CreditCard },
  { id: "security", label: "Security", icon: Shield },
  { id: "api", label: "API & Webhooks", icon: Code2 },
  { id: "data", label: "Data & Privacy", icon: Database },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "language", label: "Language", icon: Globe },
  { id: "advanced", label: "Advanced", icon: Sliders },
];

// ─── Toggle Switch ──────────────────────────────────────────────────────────────
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      type="button"
      className={`relative flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${value ? "bg-accent-purple" : "bg-surface-elevated border border-border-glass"}`}
    >
      <span className={`absolute h-5 w-5 rounded-full bg-white shadow-sm transition-all ${value ? "left-[22px]" : "left-[2px]"}`} />
    </button>
  );
}

// ─── Select Field ──────────────────────────────────────────────────────────────
function SelectField({ label, desc, value, options, onSave }: {
  label: string; desc: string; value: string; options: string[]; onSave: (val: string) => Promise<void> | void;
}) {
  const [val, setVal] = useState(value);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setVal(value);
  }, [value]);

  return (
    <div className="border-b border-border-glass/50 pb-5">
      <p className="mb-1 text-[14px] font-semibold text-foreground">{label}</p>
      <p className="mb-3 text-[12px] text-foreground-secondary">{desc}</p>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <select
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className="w-full appearance-none rounded-xl border border-border-glass bg-bg-glass px-3 py-2.5 text-[13px] text-foreground outline-none focus:border-accent-purple/50 focus:ring-1 focus:ring-accent-purple/20 cursor-pointer"
          >
            {options.map(o => <option key={o} value={o} className="bg-surface">{o}</option>)}
          </select>
          <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-foreground-muted" />
        </div>
        <button
          onClick={async () => {
            setLoading(true);
            try {
              await onSave(val);
              setSuccess(true);
              setTimeout(() => setSuccess(false), 2000);
            } catch (err) {
              console.error(err);
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading}
          className="h-9 rounded-xl bg-accent-purple px-4 text-[12px] font-semibold text-white hover:bg-accent-purple/90 transition-colors shrink-0 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
        >
          {loading ? "Saving..." : success ? <Check className="h-3.5 w-3.5" /> : "Save"}
        </button>
      </div>
    </div>
  );
}

// ─── Text Field ──────────────────────────────────────────────────────────────
function TextField({ label, desc, value, onSave, placeholder }: {
  label: string; desc: string; value: string; onSave: (val: string) => Promise<void> | void; placeholder?: string;
}) {
  const [val, setVal] = useState(value);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setVal(value || "");
  }, [value]);

  return (
    <div className="border-b border-border-glass/50 pb-5">
      <p className="mb-1 text-[14px] font-semibold text-foreground">{label}</p>
      <p className="mb-3 text-[12px] text-foreground-secondary">{desc}</p>
      <div className="flex items-center gap-2">
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder={placeholder}
          className="flex-1 rounded-xl border border-border-glass bg-bg-glass px-3 py-2.5 text-[13px] text-foreground placeholder:text-foreground-muted outline-none focus:border-accent-purple/50 focus:ring-1 focus:ring-accent-purple/20"
        />
        <button
          onClick={async () => {
            setLoading(true);
            try {
              await onSave(val);
              setSuccess(true);
              setTimeout(() => setSuccess(false), 2000);
            } catch (err) {
              console.error(err);
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading}
          className="h-9 rounded-xl bg-accent-purple px-4 text-[12px] font-semibold text-white hover:bg-accent-purple/90 transition-colors shrink-0 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
        >
          {loading ? "Saving..." : success ? <Check className="h-3.5 w-3.5" /> : "Save"}
        </button>
      </div>
    </div>
  );
}

function SettingsContent() {
  const { user, profile } = useAuthStore();
  const userId = user?.uid;

  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "general";

  const setActiveTab = (tabId: string) => {
    if (tabId === "general") {
      router.push("/settings/");
    } else {
      router.push(`/settings/?tab=${tabId}`);
    }
  };

  // Real-time local settings states
  const [workspaceName, setWorkspaceName] = useState("Traxo Workspace");
  const [trackerCount, setTrackerCount] = useState(0);
  const [prefs, setPrefs] = useState({
    emailNotifs: true,
    desktopNotifs: true,
    weeklySummary: false,
    marketingEmails: false,
    telegramNotifications: false,
    timezone: "(GMT+05:30) Asia/Kolkata",
    dateFormat: "DD MMM YYYY (31 May 2025)",
    startOfWeek: "Monday",
    defaultDashboard: "Overview",
    theme: "dark",
    language: "English",
    reducedAnimations: false,
    density: "Comfortable",
    devMode: false,
    proxyPool: "Default",
  });

  // DB Sync loading states
  const [loading, setLoading] = useState(true);

  // API keys and webhooks lists
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Webhook form state
  const [isAddWhOpen, setIsAddWhOpen] = useState(false);
  const [whName, setWhName] = useState("");
  const [whUrl, setWhUrl] = useState("");
  const [whPlatform, setWhPlatform] = useState<"custom" | "slack" | "discord">("custom");

  // Password update form state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  // Team member lists
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "developer" | "viewer">("viewer");
  const [inviteLoading, setInviteLoading] = useState(false);

  // Danger modal confirmations
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isPurgeConfirmOpen, setIsPurgeConfirmOpen] = useState(false);
  const [purgeInput, setPurgeInput] = useState("");

  // 1. Subscribe to preferences & tracker counts
  useEffect(() => {
    if (!userId) return;

    // Trackers size listener
    const trackersQ = query(collection(db, "trackers"), where("userId", "==", userId));
    const unsubTrackers = onSnapshot(trackersQ, (snap) => {
      setTrackerCount(snap.size);
    });

    // Preferences listener
    const unsubPrefs = onSnapshot(doc(db, "users", userId, "preferences", "default"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setWorkspaceName(data.workspaceName ?? "Traxo Workspace");
        setPrefs((p) => ({
          ...p,
          emailNotifs: data.emailNotifications ?? true,
          desktopNotifs: data.desktopNotifications ?? true,
          weeklySummary: data.weeklySummary ?? false,
          marketingEmails: data.marketingEmails ?? false,
          telegramNotifications: data.telegramNotifications ?? false,
          timezone: data.timezone ?? "(GMT+05:30) Asia/Kolkata",
          dateFormat: data.dateFormat ?? "DD MMM YYYY (31 May 2025)",
          startOfWeek: data.startOfWeek ?? "Monday",
          defaultDashboard: data.defaultDashboard ?? "Overview",
          theme: data.theme ?? "dark",
          language: data.language ?? "English",
          reducedAnimations: data.reducedAnimations ?? false,
          density: data.density ?? "Comfortable",
          devMode: data.devMode ?? false,
          proxyPool: data.proxyPool ?? "Default",
        }));
      }
      setLoading(false);
    });

    // API Keys listener
    const unsubKeys = onSnapshot(collection(db, "users", userId, "apiKeys"), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setApiKeys(list);
    });

    // Webhooks listener
    const unsubWebhooks = onSnapshot(collection(db, "users", userId, "webhooks"), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setWebhooks(list);
    });

    // Team listener
    const unsubTeam = onSnapshot(collection(db, "users", userId, "team"), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTeamMembers(list);
    });

    return () => {
      unsubTrackers();
      unsubPrefs();
      unsubKeys();
      unsubWebhooks();
      unsubTeam();
    };
  }, [userId]);

  // General theme updates to HTML node
  useEffect(() => {
    const root = window.document.documentElement;
    if (prefs.theme === "dark") {
      root.classList.add("dark");
    } else if (prefs.theme === "light") {
      root.classList.remove("dark");
    } else {
      // System
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (systemDark) root.classList.add("dark");
      else root.classList.remove("dark");
    }
  }, [prefs.theme]);

  // Update preferences helper
  const updatePreference = async (key: string, value: any) => {
    if (!userId) return;
    const prefRef = doc(db, "users", userId, "preferences", "default");
    const mapKey = key === "emailNotifs" ? "emailNotifications" :
                   key === "desktopNotifs" ? "desktopNotifications" : key;

    try {
      await updateDoc(prefRef, { [mapKey]: value, updatedAt: new Date() });
    } catch (err) {
      // Create if missing
      await setDoc(prefRef, { [mapKey]: value, updatedAt: new Date() }, { merge: true });
    }
  };

  // Change Plan handler
  const handleSelectPlan = async (newPlan: "free" | "pro" | "business") => {
    if (!userId) return;
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { plan: newPlan, updatedAt: new Date() });
  };

  // API Key creation
  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !newKeyName.trim()) return;

    try {
      const keyId = crypto.randomUUID().replace(/-/g, "");
      const apiKey = `tx_live_${keyId}`;

      // Save user-nested API key record
      await setDoc(doc(db, "users", userId, "apiKeys", apiKey), {
        name: newKeyName.trim(),
        apiKey,
        status: "active",
        createdAt: new Date(),
      });

      // Register centrally for scan routing middleware authentication
      await setDoc(doc(db, "apiKeys", apiKey), {
        userId,
        status: "active",
        createdAt: new Date(),
      });

      setNewKeyName("");
    } catch (err) {
      console.error("Failed to generate API Key:", err);
    }
  };

  // API Key delete
  const handleDeleteApiKey = async (apiKey: string) => {
    if (!userId) return;
    try {
      await deleteDoc(doc(db, "users", userId, "apiKeys", apiKey));
      await deleteDoc(doc(db, "apiKeys", apiKey));
    } catch (err) {
      console.error("Failed to delete API key:", err);
    }
  };

  // Webhook creation
  const handleAddWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !whUrl.trim()) return;

    try {
      const whId = `wh-${Date.now()}`;
      await setDoc(doc(db, "users", userId, "webhooks", whId), {
        id: whId,
        name: whName.trim() || `${whPlatform.toUpperCase()} Webhook`,
        url: whUrl.trim(),
        platform: whPlatform,
        events: ["new_job", "price_drop", "price_increase", "pdf_updated", "content_changed", "content_added", "content_removed"],
        active: true,
      });

      setWhName("");
      setWhUrl("");
      setWhPlatform("custom");
      setIsAddWhOpen(false);
    } catch (err) {
      console.error("Failed to save webhook:", err);
    }
  };

  // Webhook delete
  const handleDeleteWebhook = async (whId: string) => {
    if (!userId) return;
    try {
      await deleteDoc(doc(db, "users", userId, "webhooks", whId));
    } catch (err) {
      console.error("Failed to delete webhook:", err);
    }
  };

  // Invite team member
  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !inviteEmail.trim()) return;

    setInviteLoading(true);
    try {
      const memberId = `member-${Date.now()}`;
      await setDoc(doc(db, "users", userId, "team", memberId), {
        id: memberId,
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
        status: "pending",
        createdAt: new Date(),
      });
      setInviteEmail("");
      setInviteRole("viewer");
    } catch (err) {
      console.error("Failed to invite member:", err);
    } finally {
      setInviteLoading(false);
    }
  };

  // Remove team member
  const handleRemoveMember = async (memberId: string) => {
    if (!userId) return;
    try {
      await deleteDoc(doc(db, "users", userId, "team", memberId));
    } catch (err) {
      console.error("Failed to remove member:", err);
    }
  };

  // Webhook toggle
  const handleToggleWebhook = async (whId: string, currentActive: boolean) => {
    if (!userId) return;
    try {
      await updateDoc(doc(db, "users", userId, "webhooks", whId), {
        active: !currentActive,
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Password update
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(null);
    setPwdSuccess(false);

    if (newPassword !== confirmPassword) {
      setPwdError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setPwdError("Password must be at least 6 characters.");
      return;
    }

    setPwdLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("No authenticated user.");

      // Reauthenticate if possible or trigger updatePassword
      await updatePassword(currentUser, newPassword);
      setPwdSuccess(true);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      if (err.code === "auth/requires-recent-login") {
        setPwdError("For security, please log out and sign back in to change your password.");
      } else {
        setPwdError(err.message || "Failed to update password.");
      }
    } finally {
      setPwdLoading(false);
    }
  };

  // Export User data (JSON/CSV)
  const handleExportData = async (format: "json" | "csv") => {
    if (!userId) return;
    try {
      const trackersSnap = await getDocs(query(collection(db, "trackers"), where("userId", "==", userId)));
      const trackers = trackersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const collectionsSnap = await getDocs(collection(db, "users", userId, "collections"));
      const collections = collectionsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      if (format === "json") {
        const dataStr = JSON.stringify({ trackers, collections, profile, preferences: prefs }, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const filename = `traxo-backup-${userId}-${Date.now()}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', filename);
        linkElement.click();
      } else {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "ID,Name,URL,Type,Status,Frequency,Changes\n";
        trackers.forEach((t: any) => {
          csvContent += `"${t.id}","${t.name || ""}","${t.url || ""}","${t.type || ""}","${t.status || ""}","${t.frequency || ""}",${t.changeCount || 0}\n`;
        });
        const encodedUri = encodeURI(csvContent);
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', encodedUri);
        linkElement.setAttribute('download', `traxo-trackers-${Date.now()}.csv`);
        linkElement.click();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Clear logs
  const handleClearLogs = async () => {
    if (!userId) return;
    try {
      const trackersSnap = await getDocs(query(collection(db, "trackers"), where("userId", "==", userId)));
      for (const trackerDoc of trackersSnap.docs) {
        const scansSnap = await getDocs(collection(db, "trackers", trackerDoc.id, "scans"));
        const batch = writeBatch(db);
        scansSnap.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();

        const eventsSnap = await getDocs(collection(db, "trackers", trackerDoc.id, "events"));
        const eBatch = writeBatch(db);
        eventsSnap.docs.forEach(doc => eBatch.delete(doc.ref));
        await eBatch.commit();
      }
      setIsResetConfirmOpen(false);
      alert("Scanning history and events cleared successfully!");
    } catch (err) {
      console.error(err);
    }
  };

  // Purge account
  const handlePurgeAllData = async () => {
    if (!userId || purgeInput !== "DELETE MY ACCOUNT") return;

    try {
      const trackersSnap = await getDocs(query(collection(db, "trackers"), where("userId", "==", userId)));
      for (const trackerDoc of trackersSnap.docs) {
        const scansSnap = await getDocs(collection(db, "trackers", trackerDoc.id, "scans"));
        const batch = writeBatch(db);
        scansSnap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();

        const eventsSnap = await getDocs(collection(db, "trackers", trackerDoc.id, "events"));
        const eBatch = writeBatch(db);
        eventsSnap.docs.forEach(d => eBatch.delete(d.ref));
        await eBatch.commit();

        await deleteDoc(trackerDoc.ref);
      }

      const collectionsSnap = await getDocs(collection(db, "users", userId, "collections"));
      const colBatch = writeBatch(db);
      collectionsSnap.docs.forEach(d => colBatch.delete(d.ref));
      await colBatch.commit();

      const apiKeysSnap = await getDocs(collection(db, "users", userId, "apiKeys"));
      for (const keyDoc of apiKeysSnap.docs) {
        await deleteDoc(doc(db, "apiKeys", keyDoc.id));
        await deleteDoc(keyDoc.ref);
      }

      const webhooksSnap = await getDocs(collection(db, "users", userId, "webhooks"));
      const whBatch = writeBatch(db);
      webhooksSnap.docs.forEach(d => whBatch.delete(d.ref));
      await whBatch.commit();

      await deleteDoc(doc(db, "users", userId, "preferences", "default"));
      await deleteDoc(doc(db, "users", userId));

      await auth.signOut();
    } catch (err) {
      console.error(err);
    }
  };

  // Copy API key utility
  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <RefreshCw className="h-8 w-8 text-accent-purple animate-spin" />
        <p className="text-sm font-mono text-foreground-secondary">Syncing Traxo settings dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="mt-1 text-sm text-foreground-secondary">
            Manage your account, preferences, and developer tools
          </p>
        </div>
        <button className="flex h-9 items-center gap-2 rounded-xl border border-border-glass bg-bg-glass px-3 text-[12px] font-medium text-foreground-secondary hover:text-foreground transition-colors cursor-pointer">
          <HelpCircle className="h-3.5 w-3.5" />
          Help Center
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[200px_1fr_280px]">
        {/* Left Nav Menu */}
        <div className="glass-card rounded-2xl overflow-hidden h-fit">
          <div className="p-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  type="button"
                  className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors cursor-pointer ${
                    isActive
                      ? "bg-accent-purple/15 text-foreground border border-accent-purple/25"
                      : "text-foreground-secondary hover:text-foreground hover:bg-surface/50"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Center Dynamic Content */}
        <div className="glass-card rounded-2xl p-6">
          {/* GENERAL TAB */}
          {activeTab === "general" && (
            <div>
              <div className="mb-6">
                <h2 className="text-[16px] font-semibold text-foreground">General Settings</h2>
                <p className="mt-1 text-[12px] text-foreground-secondary">
                  Manage the basic configurations of your workspace settings.
                </p>
              </div>
              <div className="space-y-5">
                <TextField
                  label="Workspace Name"
                  desc="This is the name of your dashboard workspace."
                  value={workspaceName}
                  onSave={async (v) => {
                    if (!userId) return;
                    await updateDoc(doc(db, "users", userId, "preferences", "default"), { workspaceName: v });
                    setWorkspaceName(v);
                  }}
                />
                <SelectField
                  label="Time Zone"
                  desc="Set the default time zone for charts and alerts."
                  value={prefs.timezone}
                  options={["(GMT+05:30) Asia/Kolkata", "(GMT+00:00) UTC", "(GMT-05:00) New York", "(GMT+01:00) London", "(GMT+09:00) Tokyo"]}
                  onSave={(v) => updatePreference("timezone", v)}
                />
                <SelectField
                  label="Date Format"
                  desc="Choose how dates are formatted across logs."
                  value={prefs.dateFormat}
                  options={["DD MMM YYYY (31 May 2025)", "MM/DD/YYYY", "YYYY-MM-DD", "DD/MM/YYYY"]}
                  onSave={(v) => updatePreference("dateFormat", v)}
                />
                <SelectField
                  label="Start of Week"
                  desc="Configure the calendar alignment start day."
                  value={prefs.startOfWeek}
                  options={["Monday", "Sunday", "Saturday"]}
                  onSave={(v) => updatePreference("startOfWeek", v)}
                />
                <SelectField
                  label="Default Dashboard"
                  desc="Set the entry redirection page on logging in."
                  value={prefs.defaultDashboard}
                  options={["Overview", "Analytics", "Trackers", "History"]}
                  onSave={(v) => updatePreference("defaultDashboard", v)}
                />
              </div>
            </div>
          )}

          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <div>
              <div className="mb-6">
                <h2 className="text-[16px] font-semibold text-foreground">Profile Settings</h2>
                <p className="mt-1 text-[12px] text-foreground-secondary">Update your personal identification information.</p>
              </div>
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-elevated border border-border-glass overflow-hidden">
                      {profile?.photoURL ? (
                        <img src={profile.photoURL} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xl font-bold gradient-text-primary">{profile?.displayName?.[0] ?? "U"}</span>
                      )}
                    </div>
                    <button className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent-purple text-white shadow">
                      <Camera className="h-3 w-3" />
                    </button>
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-foreground">{profile?.displayName ?? "User"}</p>
                    <p className="text-[12px] text-foreground-secondary">{profile?.email ?? ""}</p>
                  </div>
                </div>
                <TextField
                  label="Display Name"
                  desc="Your name as shown across workspace alerts."
                  value={profile?.displayName ?? ""}
                  onSave={async (v) => {
                    if (!userId || !auth.currentUser) return;
                    await updateProfile(auth.currentUser, { displayName: v });
                    await updateDoc(doc(db, "users", userId), { displayName: v });
                  }}
                />
                <div className="border-b border-border-glass/50 pb-5">
                  <p className="mb-1 text-[14px] font-semibold text-foreground">Email Address</p>
                  <p className="mb-3 text-[12px] text-foreground-secondary">Your account email identifier (read-only).</p>
                  <input
                    value={profile?.email || ""}
                    disabled
                    className="w-full rounded-xl border border-border-glass bg-bg-glass/30 px-3 py-2.5 text-[13px] text-foreground-secondary outline-none cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TEAM TAB */}
          {activeTab === "team" && (
            <div>
              <div className="mb-6">
                <h2 className="text-[16px] font-semibold text-foreground font-display">Team & Workspace Members</h2>
                <p className="mt-1 text-[12px] text-foreground-secondary">Manage access roles, collaborate on trackers, and invite teammates.</p>
              </div>

              {/* Invite Member Form */}
              <div className="mb-6 p-5 rounded-xl border border-border-glass bg-bg-glass/30">
                <h3 className="text-[14px] font-semibold text-foreground mb-3">Invite Team Member</h3>
                <form onSubmit={handleInviteMember} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-foreground-secondary">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="teammate@company.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="flex h-10 w-full rounded-xl border border-border-glass bg-bg-glass px-3 text-xs text-foreground outline-none focus:border-accent-purple/50 focus:ring-1 focus:ring-accent-purple/20"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-foreground-secondary">
                        Workspace Role
                      </label>
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value as any)}
                        className="flex h-10 w-full rounded-xl border border-border-glass bg-bg-glass px-3 text-xs text-foreground outline-none focus:border-accent-purple/50 focus:ring-1 focus:ring-accent-purple/20 cursor-pointer"
                      >
                        <option value="viewer" className="bg-surface">Viewer (Read-only access)</option>
                        <option value="developer" className="bg-surface">Developer (Create/Manage trackers)</option>
                        <option value="admin" className="bg-surface">Administrator (Full billing & settings access)</option>
                      </select>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={inviteLoading}
                    className="h-9 rounded-xl bg-accent-purple px-4 text-[12px] font-semibold text-white hover:bg-accent-purple/90 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {inviteLoading ? "Sending invite..." : "Send Invitation"}
                  </button>
                </form>
              </div>

              {/* Members List */}
              <h3 className="text-[14px] font-semibold text-foreground mb-3">Workspace Members</h3>
              <div className="divide-y divide-border-glass/30 border border-border-glass rounded-xl overflow-hidden bg-bg-glass/10">
                {/* Always render workspace owner first */}
                <div className="flex items-center justify-between p-4 bg-surface-elevated/40">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-elevated border border-border-glass text-xs font-bold font-display gradient-text-primary">
                      {profile?.displayName?.[0] ?? "O"}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-foreground">{profile?.displayName ?? "Workspace Owner"}</p>
                      <p className="text-[11px] text-foreground-secondary">{profile?.email ?? ""}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-accent-purple/15 border border-accent-purple/35 px-2 py-0.5 text-[9px] font-bold text-accent-purple font-mono uppercase">
                    Owner
                  </span>
                </div>

                {/* Render listed members */}
                {teamMembers.length === 0 ? (
                  <div className="p-8 text-center text-foreground-muted flex flex-col items-center justify-center">
                    <Users className="h-6 w-6 text-foreground-muted/40 mb-2" />
                    <p className="text-[12px]">No other members added to this workspace yet.</p>
                    <p className="text-[10px] text-foreground-muted/80 mt-0.5">Invite coworkers above to collaborate.</p>
                  </div>
                ) : (
                  teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 hover:bg-surface-elevated/25 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-elevated border border-border-glass text-xs font-bold font-display text-foreground-secondary">
                          {member.email[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-foreground">{member.email.split("@")[0]}</p>
                          <p className="text-[11px] text-foreground-secondary">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold font-mono uppercase ${
                          member.status === "pending"
                            ? "bg-warning/15 border border-warning/35 text-warning"
                            : "bg-accent-cyan/15 border border-accent-cyan/35 text-accent-cyan"
                        }`}>
                          {member.role} ({member.status})
                        </span>
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="p-1.5 text-error hover:bg-error/10 border border-error/15 rounded-lg transition-colors cursor-pointer"
                          title="Remove member"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === "notifications" && (
            <div>
              <div className="mb-6">
                <h2 className="text-[16px] font-semibold text-foreground">Notification Settings</h2>
                <p className="mt-1 text-[12px] text-foreground-secondary">Configure sweep alerts and digest frequencies.</p>
              </div>
              <div className="space-y-4">
                {[
                  { key: "emailNotifs" as const, label: "Email Notifications", desc: "Receive email updates about important activity." },
                  { key: "desktopNotifs" as const, label: "Desktop Notifications", desc: "Show push notifications on your browser." },
                  { key: "weeklySummary" as const, label: "Weekly Summary", desc: "Receive an analytics digest every Monday morning." },
                  { key: "marketingEmails" as const, label: "Marketing Emails", desc: "Keep up with product announcements and offers." },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between border-b border-border-glass/50 pb-4">
                    <div>
                      <p className="text-[13px] font-semibold text-foreground">{item.label}</p>
                      <p className="text-[12px] text-foreground-secondary">{item.desc}</p>
                    </div>
                    <Toggle
                      value={prefs[item.key]}
                      onChange={(v) => {
                        setPrefs(p => ({ ...p, [item.key]: v }));
                        updatePreference(item.key, v);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BILLING TAB */}
          {activeTab === "billing" && (
            <div>
              <div className="mb-6">
                <h2 className="text-[16px] font-semibold text-foreground">Billing & Plans</h2>
                <p className="mt-1 text-[12px] text-foreground-secondary">Configure subscription tiers and view billing history.</p>
              </div>

              {/* Usage thresholds indicator */}
              <div className="mb-6 p-4 rounded-xl border border-border-glass bg-bg-glass">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-semibold text-foreground">Tracker Usage Limits</span>
                  <span className="text-[12px] text-foreground-secondary">
                    {trackerCount} / {profile?.plan === "business" ? "∞" : profile?.plan === "pro" ? "50" : "5"}
                  </span>
                </div>
                <div className="w-full bg-surface-elevated rounded-full h-2 overflow-hidden border border-border-glass">
                  <div
                    className="gradient-bg-primary h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        (trackerCount / (profile?.plan === "business" ? 100 : profile?.plan === "pro" ? 50 : 5)) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
                <p className="text-[10px] text-foreground-muted mt-2">
                  Currently running {trackerCount} trackers out of your plan allowance. Upgrade to expand workspace slots.
                </p>
              </div>

              {/* Plans Grid */}
              <h3 className="text-[14px] font-semibold text-foreground mb-4">Subscription Tiers</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[
                  { id: "free", name: "Free Basic", price: "$0", trackers: "5 slots", freq: "Daily checks" },
                  { id: "pro", name: "Pro Sweep", price: "$19", trackers: "50 slots", freq: "Hourly checks", popular: true },
                  { id: "business", name: "Enterprise", price: "$99", trackers: "Unlimited", freq: "5-min checks" },
                ].map((tier) => {
                  const isActive = (profile?.plan || "free") === tier.id;
                  return (
                    <div
                      key={tier.id}
                      className={`relative flex flex-col justify-between rounded-xl border p-4 transition-all duration-300 ${
                        isActive
                          ? "border-accent-purple/50 bg-accent-purple/5 shadow-[0_0_15px_rgba(139,92,246,0.15)]"
                          : "border-border-glass bg-bg-glass/30 hover:border-border-glass/80"
                      }`}
                    >
                      {tier.popular && (
                        <span className="absolute -top-2.5 right-3 rounded-full bg-accent-purple px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white">
                          Popular
                        </span>
                      )}
                      <div>
                        <h4 className="text-[13px] font-bold text-foreground">{tier.name}</h4>
                        <div className="mt-1 flex items-baseline">
                          <span className="text-xl font-bold font-mono text-foreground">{tier.price}</span>
                          <span className="text-[10px] text-foreground-muted">/month</span>
                        </div>
                        <ul className="mt-3 space-y-1.5 text-[10px] text-foreground-secondary">
                          <li className="flex items-center gap-1.5">✓ {tier.trackers}</li>
                          <li className="flex items-center gap-1.5">✓ {tier.freq}</li>
                          <li className="flex items-center gap-1.5">✓ Slack/Discord integrations</li>
                        </ul>
                      </div>
                      <button
                        onClick={() => handleSelectPlan(tier.id as any)}
                        className={`w-full mt-4 rounded-lg py-1.5 text-[11px] font-semibold transition-colors cursor-pointer ${
                          isActive
                            ? "bg-accent-purple/20 border border-accent-purple/35 text-foreground-secondary"
                            : "bg-surface-elevated hover:bg-surface border border-border-glass text-foreground hover:text-white"
                        }`}
                      >
                        {isActive ? "Current Plan" : "Choose Tier"}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Payment Details */}
              <div className="border-t border-border-glass/50 pt-5">
                <h3 className="text-[14px] font-semibold text-foreground mb-3">Saved Payment Details</h3>
                <div className="flex items-center justify-between rounded-xl border border-border-glass bg-bg-glass p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-12 items-center justify-center rounded bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-foreground">
                      VISA
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold text-foreground">•••• •••• •••• 4242</p>
                      <p className="text-[10px] text-foreground-secondary">Expires 12/28 | Automatic renewal active</p>
                    </div>
                  </div>
                  <button className="rounded-lg border border-border-glass px-3 py-1.5 text-[11px] font-semibold text-foreground hover:bg-surface transition-colors cursor-pointer">
                    Edit Card
                  </button>
                </div>
              </div>

              {/* Invoices List */}
              <div className="border-t border-border-glass/50 mt-5 pt-5">
                <h3 className="text-[14px] font-semibold text-foreground mb-3">Billing History</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border-glass text-[10px] uppercase font-mono tracking-wider text-foreground-secondary">
                        <th className="py-2">Invoice ID</th>
                        <th className="py-2">Billing Date</th>
                        <th className="py-2">Amount Paid</th>
                        <th className="py-2">Status</th>
                        <th className="py-2 text-right">PDF</th>
                      </tr>
                    </thead>
                    <tbody className="text-[12px] divide-y divide-border-glass/30">
                      {[
                        { id: "TX-902", date: "May 10, 2026", amount: "$19.00", status: "Success" },
                        { id: "TX-883", date: "Apr 10, 2026", amount: "$19.00", status: "Success" },
                        { id: "TX-764", date: "Mar 10, 2026", amount: "$19.00", status: "Success" },
                      ].map((inv) => (
                        <tr key={inv.id} className="text-foreground-secondary">
                          <td className="py-2.5 font-mono text-[11px]">{inv.id}</td>
                          <td className="py-2.5">{inv.date}</td>
                          <td className="py-2.5 font-mono">{inv.amount}</td>
                          <td className="py-2.5">
                            <span className="inline-block rounded-full bg-success/15 border border-success/35 px-2 py-0.5 text-[9px] font-semibold text-success">
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-2.5 text-right">
                            <button className="p-1 hover:text-foreground hover:bg-bg-glass rounded transition-all cursor-pointer">
                              <Download className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === "security" && (
            <div>
              <div className="mb-6">
                <h2 className="text-[16px] font-semibold text-foreground">Security Settings</h2>
                <p className="mt-1 text-[12px] text-foreground-secondary">Manage access credentials and multi-factor authenticators.</p>
              </div>

              {/* Change Password Form */}
              <div className="mb-6">
                <h3 className="text-[14px] font-semibold text-foreground mb-3">Change Account Password</h3>
                {pwdError && (
                  <div className="mb-4 rounded-xl border border-error/20 bg-error/10 p-3 text-xs text-error font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{pwdError}</span>
                  </div>
                )}
                {pwdSuccess && (
                  <div className="mb-4 rounded-xl border border-success/20 bg-success/10 p-3 text-xs text-success font-medium flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    <span>Password updated successfully.</span>
                  </div>
                )}

                {profile?.provider === "google" ? (
                  <div className="rounded-xl border border-border-glass bg-bg-glass/30 p-4">
                    <div className="flex gap-2">
                      <ShieldAlert className="h-5 w-5 text-accent-cyan" />
                      <div>
                        <p className="text-[13px] font-semibold text-foreground">OAuth Identity provider Linked</p>
                        <p className="text-[11px] text-foreground-secondary mt-0.5">
                          You are registered via Google OAuth. To modify password configurations, configure changes directly within your Google Profile security portal.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleUpdatePassword} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-mono uppercase tracking-wider text-foreground-secondary">
                        New Password
                      </label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="flex h-10 w-full rounded-xl border border-border-glass bg-bg-glass px-3 text-xs text-foreground outline-none focus:border-accent-purple/50 focus:ring-1 focus:ring-accent-purple/20"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-mono uppercase tracking-wider text-foreground-secondary">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm password"
                        className="flex h-10 w-full rounded-xl border border-border-glass bg-bg-glass px-3 text-xs text-foreground outline-none focus:border-accent-purple/50 focus:ring-1 focus:ring-accent-purple/20"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={pwdLoading}
                      className="h-9 rounded-xl bg-accent-purple px-4 text-[12px] font-semibold text-white hover:bg-accent-purple/90 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {pwdLoading ? "Updating..." : "Update Password"}
                    </button>
                  </form>
                )}
              </div>

              {/* Two-Factor Authentication Toggle */}
              <div className="border-t border-border-glass/50 pt-5 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-[14px] font-semibold text-foreground">Two-Factor Authentication (2FA)</h3>
                    <p className="text-[11px] text-foreground-secondary mt-0.5">Protect your workspace sweeps from intrusion.</p>
                  </div>
                  <Toggle
                    value={prefs.telegramNotifications} // linking 2fa mockup to preferences trigger state
                    onChange={(v) => updatePreference("telegramNotifications", v)}
                  />
                </div>

                {prefs.telegramNotifications && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-4 p-4 rounded-xl border border-border-glass bg-bg-glass space-y-4 overflow-hidden"
                  >
                    <p className="text-[11px] text-foreground-secondary">
                      Scan the following authentication token inside Google Authenticator or Microsoft Authenticator app:
                    </p>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      {/* Styled mock QR code using HTML grid and divs */}
                      <div className="h-28 w-28 shrink-0 bg-white p-2 rounded-lg flex items-center justify-center shadow-lg border border-border-glass">
                        <div className="grid grid-cols-4 gap-1 w-full h-full">
                          {Array.from({ length: 16 }).map((_, i) => (
                            <div
                              key={i}
                              className={`rounded ${
                                (i * 7 + 3) % 2 === 0 ? "bg-black" : "bg-transparent"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex-1 space-y-2">
                        <div>
                          <p className="text-[10px] font-mono text-foreground-muted uppercase tracking-wider">Secret Key</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-xs font-semibold text-foreground bg-surface-elevated border border-border-glass px-2.5 py-1 rounded-lg">
                              ABCD 1234 EFGH 5678
                            </span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText("ABCD 1234 EFGH 5678");
                                alert("Secret key copied!");
                              }}
                              className="p-1 hover:text-foreground text-foreground-secondary hover:bg-surface-elevated rounded border border-border-glass cursor-pointer"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-[10px] text-foreground-muted">
                          Enter this key manually if your camera is not working. Once entered, your app will start generating credentials.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Active Sessions Panel */}
              <div className="border-t border-border-glass/50 pt-5">
                <h3 className="text-[14px] font-semibold text-foreground mb-3">Active Device Sessions</h3>
                <div className="space-y-3">
                  <div className="flex items-start justify-between border-b border-border-glass/30 pb-3">
                    <div className="flex gap-3">
                      <Laptop className="h-4 w-4 text-accent-cyan mt-0.5" />
                      <div>
                        <p className="text-[12px] font-semibold text-foreground">Chrome on Windows Desktop (Current)</p>
                        <p className="text-[10px] text-foreground-muted">Mumbai, India | IP: 103.220.x.x | Active now</p>
                      </div>
                    </div>
                    <span className="rounded bg-accent-cyan/15 border border-accent-cyan/35 px-1.5 py-0.5 text-[9px] font-mono font-bold text-accent-cyan">
                      Active
                    </span>
                  </div>

                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      <Smartphone className="h-4 w-4 text-foreground-muted mt-0.5" />
                      <div>
                        <p className="text-[12px] font-semibold text-foreground">Safari on Apple iPhone</p>
                        <p className="text-[10px] text-foreground-muted">Delhi, India | IP: 202.14.x.x | 2 days ago</p>
                      </div>
                    </div>
                    <button className="text-[10px] font-semibold text-error hover:underline cursor-pointer">
                      Revoke
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* API & WEBHOOKS TAB */}
          {activeTab === "api" && (
            <div>
              <div className="mb-6">
                <h2 className="text-[16px] font-semibold text-foreground">API & Webhooks Configuration</h2>
                <p className="mt-1 text-[12px] text-foreground-secondary">Manage developer integrations and callback hooks.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* API Keys management */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-[14px] font-semibold text-foreground">Personal API Keys</h3>
                    <p className="text-[11px] text-foreground-secondary mt-0.5">Use keys to read/write trackers programmatically.</p>
                  </div>

                  <form onSubmit={handleCreateApiKey} className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Production server"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      className="flex-1 rounded-xl border border-border-glass bg-bg-glass px-3 py-2 text-xs text-foreground outline-none focus:border-accent-purple/50 focus:ring-1 focus:ring-accent-purple/20"
                    />
                    <button
                      type="submit"
                      className="rounded-xl bg-accent-purple px-3 py-2 text-[11px] font-semibold text-white hover:bg-accent-purple/90 cursor-pointer shrink-0"
                    >
                      Generate Key
                    </button>
                  </form>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {apiKeys.length === 0 ? (
                      <div className="flex flex-col items-center justify-center border border-dashed border-border-glass rounded-xl py-8 text-center text-foreground-muted">
                        <Key className="h-6 w-6 mb-1.5 opacity-50" />
                        <span className="text-[11px]">No active API keys found</span>
                      </div>
                    ) : (
                      apiKeys.map((key) => {
                        const isRevealed = !!revealedKeys[key.id];
                        return (
                          <div key={key.id} className="flex items-center justify-between border border-border-glass rounded-xl p-3 bg-bg-glass/30">
                            <div className="min-w-0 flex-1">
                              <p className="text-[12px] font-semibold text-foreground truncate">{key.name}</p>
                              <p className="text-[10px] font-mono text-foreground-secondary truncate mt-0.5">
                                {isRevealed ? key.apiKey : `${key.apiKey.substring(0, 12)}••••••••••••••••`}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                              <button
                                onClick={() => setRevealedKeys(p => ({ ...p, [key.id]: !isRevealed }))}
                                className="p-1.5 hover:text-foreground text-foreground-secondary hover:bg-bg-glass rounded border border-border-glass/40 cursor-pointer"
                                title="Show/Hide key"
                              >
                                {isRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              </button>
                              <button
                                onClick={() => handleCopyKey(key.apiKey)}
                                className="p-1.5 hover:text-foreground text-foreground-secondary hover:bg-bg-glass rounded border border-border-glass/40 cursor-pointer"
                                title="Copy key"
                              >
                                {copiedKey === key.apiKey ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                              </button>
                              <button
                                onClick={() => handleDeleteApiKey(key.apiKey)}
                                className="p-1.5 hover:text-error text-error/80 hover:bg-error/10 rounded border border-error/20 cursor-pointer"
                                title="Revoke key"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Webhooks management */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-[14px] font-semibold text-foreground">Webhook URLs</h3>
                      <p className="text-[11px] text-foreground-secondary mt-0.5">Route event outputs to channels or systems.</p>
                    </div>
                    <button
                      onClick={() => setIsAddWhOpen(true)}
                      className="text-[11px] text-accent-purple hover:underline font-semibold cursor-pointer"
                    >
                      Connect URL
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {webhooks.length === 0 ? (
                      <div className="flex flex-col items-center justify-center border border-dashed border-border-glass rounded-xl py-8 text-center text-foreground-muted">
                        <Code2 className="h-6 w-6 mb-1.5 opacity-50" />
                        <span className="text-[11px]">No active webhooks configured</span>
                      </div>
                    ) : (
                      webhooks.map((wh) => (
                        <div key={wh.id} className="flex items-center justify-between border border-border-glass rounded-xl p-3 bg-bg-glass/30">
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-semibold text-foreground truncate">{wh.name}</p>
                            <p className="text-[10px] font-mono text-foreground-secondary truncate mt-0.5">{wh.url}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <Toggle value={wh.active} onChange={() => handleToggleWebhook(wh.id, wh.active)} />
                            <button
                              onClick={() => handleDeleteWebhook(wh.id)}
                              className="p-1.5 hover:text-error text-error/80 hover:bg-error/10 rounded border border-error/20 cursor-pointer"
                              title="Delete webhook"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DATA & PRIVACY TAB */}
          {activeTab === "data" && (
            <div>
              <div className="mb-6">
                <h2 className="text-[16px] font-semibold text-foreground">Data & Privacy Control</h2>
                <p className="mt-1 text-[12px] text-foreground-secondary">Manage workspace imports, exports, and account deletion settings.</p>
              </div>

              <div className="space-y-6">
                {/* Data Export section */}
                <div className="border-b border-border-glass/50 pb-5">
                  <h3 className="text-[14px] font-semibold text-foreground mb-1">Export Workspace Datasets</h3>
                  <p className="text-[12px] text-foreground-secondary mb-4">
                    Download local copies of all trackers, collection groups, logs, and preferences.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => handleExportData("json")}
                      className="flex h-9 items-center gap-2 rounded-xl bg-accent-purple px-4 text-[12px] font-semibold text-white hover:bg-accent-purple/90 transition-colors cursor-pointer"
                    >
                      <Download className="h-4 w-4" />
                      Export Workspace (JSON)
                    </button>
                    <button
                      onClick={() => handleExportData("csv")}
                      className="flex h-9 items-center gap-2 rounded-xl border border-border-glass bg-bg-glass px-4 text-[12px] font-semibold text-foreground hover:bg-surface transition-colors cursor-pointer"
                    >
                      <Download className="h-4 w-4" />
                      Export Trackers (CSV)
                    </button>
                  </div>
                </div>

                {/* Reset History Logs section */}
                <div className="border-b border-border-glass/50 pb-5">
                  <h3 className="text-[14px] font-semibold text-foreground mb-1">Clear Scanning Logs</h3>
                  <p className="text-[12px] text-foreground-secondary mb-4">
                    Delete historical scan logs and notification events. Trackers and settings are preserved.
                  </p>
                  <button
                    onClick={() => setIsResetConfirmOpen(true)}
                    className="h-9 rounded-xl border border-warning px-4 text-[12px] font-semibold text-warning hover:bg-warning/10 transition-colors cursor-pointer"
                  >
                    Clear Logs History
                  </button>
                </div>

                {/* Purge Account */}
                <div>
                  <h3 className="text-[14px] font-semibold text-error mb-1">Purge Account and Data</h3>
                  <p className="text-[12px] text-foreground-secondary mb-4">
                    Completely and permanently delete your profile, trackers, collections, API keys, and logs from Traxo databases. This action is irreversible.
                  </p>
                  <button
                    onClick={() => setIsPurgeConfirmOpen(true)}
                    className="h-9 rounded-xl bg-error px-4 text-[12px] font-semibold text-white hover:bg-error/90 transition-colors cursor-pointer"
                  >
                    Purge Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* APPEARANCE TAB */}
          {activeTab === "appearance" && (
            <div>
              <div className="mb-6">
                <h2 className="text-[16px] font-semibold text-foreground">Visual Appearance</h2>
                <p className="mt-1 text-[12px] text-foreground-secondary">Personalize interface theme configurations.</p>
              </div>

              <div className="space-y-6">
                {/* Theme Selector */}
                <div>
                  <h3 className="text-[14px] font-semibold text-foreground mb-3">Interface Theme</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { id: "light", label: "Light Theme", icon: Sun },
                      { id: "dark", label: "Dark Theme", icon: Moon },
                      { id: "system", label: "System Theme", icon: Settings },
                    ].map((themeOpt) => {
                      const isActive = prefs.theme === themeOpt.id;
                      const Icon = themeOpt.icon;
                      return (
                        <button
                          key={themeOpt.id}
                          onClick={() => updatePreference("theme", themeOpt.id)}
                          className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                            isActive
                              ? "border-accent-purple/50 bg-accent-purple/5"
                              : "border-border-glass bg-bg-glass/30 hover:border-border-glass/85"
                          }`}
                        >
                          <Icon className={`h-5 w-5 ${isActive ? "text-accent-purple animate-pulse" : "text-foreground-secondary"}`} />
                          <span className="text-[11px] font-semibold text-foreground mt-2">{themeOpt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Animation reducción y Density options */}
                <div className="border-t border-border-glass/50 pt-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-[13px] font-semibold text-foreground">Reduce Animations</h4>
                      <p className="text-[11px] text-foreground-secondary">Disable UI transitions to speed up render response.</p>
                    </div>
                    <Toggle
                      value={prefs.reducedAnimations}
                      onChange={(v) => {
                        setPrefs(p => ({ ...p, reducedAnimations: v }));
                        updatePreference("reducedAnimations", v);
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between border-t border-border-glass/30 pt-4">
                    <div>
                      <h4 className="text-[13px] font-semibold text-foreground">Interface Density</h4>
                      <p className="text-[11px] text-foreground-secondary">Choose spacing layout for dashboard components.</p>
                    </div>
                    <select
                      value={prefs.density}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPrefs(p => ({ ...p, density: val }));
                        updatePreference("density", val);
                      }}
                      className="rounded-xl border border-border-glass bg-bg-glass px-2.5 py-1.5 text-xs text-foreground cursor-pointer"
                    >
                      <option value="Comfortable">Comfortable</option>
                      <option value="Compact">Compact</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LANGUAGE TAB */}
          {activeTab === "language" && (
            <div>
              <div className="mb-6">
                <h2 className="text-[16px] font-semibold text-foreground">Language & Regional settings</h2>
                <p className="mt-1 text-[12px] text-foreground-secondary">Manage local localization and formatting.</p>
              </div>
              <div className="space-y-5">
                <SelectField
                  label="Display Language"
                  desc="Select display language for dashboards."
                  value={prefs.language}
                  options={["English", "Spanish", "French", "German", "Japanese", "Hindi"]}
                  onSave={(v) => updatePreference("language", v)}
                />
                <SelectField
                  label="System Timezone"
                  desc="Change standard scanning schedule offset timezone."
                  value={prefs.timezone}
                  options={["(GMT+05:30) Asia/Kolkata", "(GMT+00:00) UTC", "(GMT-05:00) New York", "(GMT+01:00) London"]}
                  onSave={(v) => updatePreference("timezone", v)}
                />
              </div>
            </div>
          )}

          {/* ADVANCED TAB */}
          {activeTab === "advanced" && (
            <div>
              <div className="mb-6">
                <h2 className="text-[16px] font-semibold text-foreground">Advanced Settings</h2>
                <p className="mt-1 text-[12px] text-foreground-secondary">Developer settings and database recovery controls.</p>
              </div>

              <div className="space-y-5">
                {/* Developer Mode */}
                <div className="flex items-center justify-between border-b border-border-glass/50 pb-4">
                  <div>
                    <h3 className="text-[13px] font-semibold text-foreground">Developer Diagnostics</h3>
                    <p className="text-[11px] text-foreground-secondary">Expose extended JSON debug states inside sweeps.</p>
                  </div>
                  <Toggle
                    value={prefs.devMode}
                    onChange={(v) => {
                      setPrefs(p => ({ ...p, devMode: v }));
                      updatePreference("devMode", v);
                    }}
                  />
                </div>

                {/* Proxy Settings */}
                <div className="border-b border-border-glass/50 pb-5">
                  <h3 className="text-[13px] font-semibold text-foreground mb-1">Global Scanning Proxy</h3>
                  <p className="text-[11px] text-foreground-secondary mb-3">Choose proxy routing network for background scraper runs.</p>
                  <select
                    value={prefs.proxyPool}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPrefs(p => ({ ...p, proxyPool: val }));
                      updatePreference("proxyPool", val);
                    }}
                    className="w-full rounded-xl border border-border-glass bg-bg-glass px-3 py-2 text-xs text-foreground outline-none focus:border-accent-purple/50 focus:ring-1 focus:ring-accent-purple/20 cursor-pointer"
                  >
                    <option value="Default">Default Routing (Cloudflare CDN network)</option>
                    <option value="Residential">Residential Proxies (Recommended for prices)</option>
                    <option value="Datacenter">Datacenter Pool (Fastest response)</option>
                  </select>
                </div>

                {/* Manual workspace backups */}
                <div>
                  <h3 className="text-[13px] font-semibold text-foreground mb-1">Manual Configuration Backup</h3>
                  <p className="text-[11px] text-foreground-secondary mb-3">Copy-paste manual base64 string to export/import dashboard setups.</p>
                  <textarea
                    readOnly
                    value={Buffer.from(JSON.stringify({ trackersCount: trackerCount, prefs })).toString("base64")}
                    onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                    className="w-full h-16 font-mono text-[10px] bg-bg-glass/30 border border-border-glass rounded-xl p-3 resize-none outline-none select-all"
                  />
                  <p className="text-[9px] text-foreground-muted mt-1">
                    Click to select all, copy, and paste to save config locally.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Info Panel */}
        <div className="flex flex-col gap-4">
          {/* Account Details */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="mb-4 text-[14px] font-semibold text-foreground font-display">Account Info</h3>
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-2">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-elevated border border-border-glass overflow-hidden">
                  {profile?.photoURL ? (
                    <img src={profile.photoURL} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold gradient-text-primary">{profile?.displayName?.[0] ?? "U"}</span>
                  )}
                </div>
                <button className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-accent-purple text-white shadow">
                  <Camera className="h-3 w-3" />
                </button>
              </div>
              <div className="flex items-center gap-1.5 mb-1">
                <p className="text-[14px] font-semibold text-foreground">{profile?.displayName ?? "User"}</p>
                <span className="rounded-full border border-accent-purple/30 bg-accent-purple/10 px-1.5 py-0.5 text-[9px] font-semibold text-accent-purple capitalize">
                  {profile?.plan || "Free"}
                </span>
              </div>
              <p className="text-[12px] text-foreground-secondary mb-3 truncate max-w-full">{profile?.email ?? ""}</p>
              <button
                onClick={() => setActiveTab("profile")}
                className="w-full rounded-xl border border-border-glass bg-bg-glass py-2 text-[12px] font-medium text-foreground hover:bg-surface transition-colors cursor-pointer"
              >
                Edit Profile
              </button>
            </div>
          </div>

          {/* Quick Info card */}
          <div className="glass-card rounded-2xl p-5 text-[12px] text-foreground-secondary space-y-3">
            <h3 className="text-[14px] font-semibold text-foreground font-display">System State</h3>
            <div className="flex justify-between border-b border-border-glass/30 pb-2">
              <span>Theme Preference</span>
              <span className="font-mono text-[10px] text-foreground uppercase">{prefs.theme}</span>
            </div>
            <div className="flex justify-between border-b border-border-glass/30 pb-2">
              <span>Language Set</span>
              <span className="font-mono text-[10px] text-foreground">{prefs.language}</span>
            </div>
            <div className="flex justify-between border-b border-border-glass/30 pb-2">
              <span>Active API Keys</span>
              <span className="font-mono text-[10px] text-foreground">{apiKeys.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Callbacks Hooks</span>
              <span className="font-mono text-[10px] text-foreground">{webhooks.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex items-center justify-center gap-4 text-[11px] text-foreground-muted border-t border-border-glass/50 pt-4">
        <span>© 2026 Traxo. All rights reserved.</span>
        <button className="hover:text-accent-primary transition-colors cursor-pointer">Privacy Policy</button>
        <button className="hover:text-accent-primary transition-colors cursor-pointer">Terms of Service</button>
      </div>

      {/* WEBHOOK ADD MODAL */}
      <AnimatePresence>
        {isAddWhOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl border border-border-glass bg-surface p-6 shadow-2xl space-y-4"
            >
              <div>
                <h3 className="text-lg font-bold text-foreground">Connect Webhook</h3>
                <p className="text-xs text-foreground-secondary mt-0.5">
                  Configure a target URL to broadcast workspace trigger scans payload.
                </p>
              </div>

              <form onSubmit={handleAddWebhook} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-foreground-secondary">
                    Integration Target
                  </label>
                  <select
                    value={whPlatform}
                    onChange={(e) => setWhPlatform(e.target.value as any)}
                    className="flex h-10 w-full rounded-lg border border-border-glass bg-bg-glass px-3 text-xs text-foreground outline-none focus:bg-surface focus:border-accent-primary cursor-pointer"
                  >
                    <option value="custom">Generic JSON POST API</option>
                    <option value="slack">Slack Channel Callback</option>
                    <option value="discord">Discord Server Webhook</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-foreground-secondary">
                    Webhook Label Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chat logs alerts"
                    value={whName}
                    onChange={(e) => setWhName(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-border-glass bg-bg-glass px-3 text-xs text-foreground outline-none focus:bg-surface focus:border-accent-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-foreground-secondary">
                    Target URL Endpoint
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://api.domain.com/hooks"
                    value={whUrl}
                    onChange={(e) => setWhUrl(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-border-glass bg-bg-glass px-3 text-xs text-foreground outline-none focus:bg-surface focus:border-accent-primary"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddWhOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-foreground-secondary hover:text-foreground bg-surface rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-accent-purple hover:bg-accent-purple/90 rounded-lg cursor-pointer"
                  >
                    Add Webhook
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CLEAR LOGS WARNING MODAL */}
      <AnimatePresence>
        {isResetConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-2xl border border-border-glass bg-surface p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-2.5 text-warning">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="text-[15px] font-bold text-foreground">Clear scanning records?</h3>
              </div>
              <p className="text-xs text-foreground-secondary">
                This will delete every scan result record and triggered events logs in the database. Trackers and group layouts are not modified.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsResetConfirmOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-foreground-secondary hover:text-foreground bg-surface rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearLogs}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-warning hover:bg-warning/90 rounded-lg cursor-pointer"
                >
                  Clear History
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ACCOUNT PURGE WARNING MODAL */}
      <AnimatePresence>
        {isPurgeConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl border border-error/25 bg-surface p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-2.5 text-error">
                <AlertTriangle className="h-6 w-6" />
                <h3 className="text-base font-bold text-foreground">Purge Profile & Datasets</h3>
              </div>
              <p className="text-xs text-foreground-secondary">
                You are about to delete your profile, trackers, webhooks, keys, logs, and configurations permanently. This is a destructive, non-recoverable operation.
              </p>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-error uppercase tracking-wider">
                  Type "DELETE MY ACCOUNT" to confirm
                </label>
                <input
                  type="text"
                  placeholder="DELETE MY ACCOUNT"
                  value={purgeInput}
                  onChange={(e) => setPurgeInput(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-error/30 bg-bg-glass px-3 text-xs text-error font-semibold outline-none focus:ring-1 focus:ring-error"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsPurgeConfirmOpen(false);
                    setPurgeInput("");
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-foreground-secondary hover:text-foreground bg-surface rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePurgeAllData}
                  disabled={purgeInput !== "DELETE MY ACCOUNT"}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-error hover:bg-error/90 rounded-lg cursor-pointer disabled:opacity-50"
                >
                  Permanently Purge
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <RefreshCw className="h-8 w-8 text-accent-purple animate-spin" />
        <p className="text-sm font-mono text-foreground-secondary">Syncing Traxo settings dashboard...</p>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
