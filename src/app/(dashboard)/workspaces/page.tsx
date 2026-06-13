"use client";

import React, { useEffect, useState } from "react";
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
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Plus,
  Settings,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Layers,
  Activity,
  ArrowRight,
  Sparkles,
  UserMinus,
  Mail,
  ChevronRight,
  Clock,
  Briefcase,
  Sliders,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Workspace {
  id: string;
  name: string;
  creatorId: string;
  members: Record<string, "owner" | "admin" | "editor" | "viewer">;
  createdAt: any;
}

interface MemberDetail {
  email: string;
  role: "owner" | "admin" | "editor" | "viewer";
  joinedAt: string;
}

export default function WorkspacesPage() {
  const { user, profile } = useAuthStore();
  const userId = user?.uid;

  // Workspace lists
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  // Dialog Creation State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [creating, setCreating] = useState(false);

  // Member Invites State
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "editor" | "viewer">("viewer");
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  // Fallback demo workspaces
  const mockWorkspaces: Workspace[] = [
    {
      id: "ws-personal",
      name: "Personal Watchlist",
      creatorId: userId ?? "admin",
      members: {
        [userId ?? "admin"]: "owner",
      },
      createdAt: Timestamp.now(),
    },
    {
      id: "ws-engineering",
      name: "Engineering Team Workspace",
      creatorId: "sys-admin",
      members: {
        [userId ?? "admin"]: "admin",
        "intern@traxo.io": "editor",
        "cto@traxo.io": "owner",
        "auditor@traxo.io": "viewer",
      },
      createdAt: Timestamp.now(),
    },
  ];

  // Load Workspaces from Firestore
  useEffect(() => {
    if (!userId) return;

    const loadWorkspaces = async () => {
      try {
        setLoading(true);
        const wsRef = collection(db, "workspaces");
        const snap = await getDocs(wsRef);

        let list: Workspace[] = [];
        if (!snap.empty) {
          list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Workspace[];
        } else {
          // Initialize mock workspaces if Firestore is clean
          list = mockWorkspaces;
          for (const item of mockWorkspaces) {
            await setDoc(doc(db, "workspaces", item.id), item);
          }
        }

        // Filter workspaces where user is a member
        const userWorkspaces = list.filter((w) => w.members && w.members[userId] !== undefined);
        setWorkspaces(userWorkspaces);
        if (userWorkspaces.length > 0) {
          setActiveWorkspace(userWorkspaces[0]);
        }
      } catch (err) {
        console.error("Failed to load workspaces:", err);
      } finally {
        setLoading(false);
      }
    };

    loadWorkspaces();
  }, [userId]);

  // Create Workspace
  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !newWorkspaceName.trim()) return;

    try {
      setCreating(true);
      const newId = `ws-${Date.now()}`;
      const newWS: Workspace = {
        id: newId,
        name: newWorkspaceName.trim(),
        creatorId: userId,
        members: {
          [userId]: "owner",
        },
        createdAt: Timestamp.now(),
      };

      await setDoc(doc(db, "workspaces", newId), newWS);
      setWorkspaces((prev) => [...prev, newWS]);
      setActiveWorkspace(newWS);
      setNewWorkspaceName("");
      setIsCreateOpen(false);
    } catch (err) {
      console.error("Failed to create workspace:", err);
    } finally {
      setCreating(false);
    }
  };

  // Invite Team Member
  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !activeWorkspace || !inviteEmail.trim()) return;

    try {
      setInviting(true);
      setInviteSuccess(null);

      const wsDocRef = doc(db, "workspaces", activeWorkspace.id);
      const updatedMembers = {
        ...activeWorkspace.members,
        [inviteEmail.trim().replace(/\./g, "_")]: inviteRole, // Firestore keys cannot contain dots directly in some paths, clean representation
      };

      await updateDoc(wsDocRef, {
        members: updatedMembers,
      });

      const updatedWS = { ...activeWorkspace, members: updatedMembers };
      setWorkspaces((prev) => prev.map((w) => (w.id === activeWorkspace.id ? updatedWS : w)));
      setActiveWorkspace(updatedWS);

      setInviteSuccess(`Invitation sent to ${inviteEmail}!`);
      setInviteEmail("");
      setTimeout(() => setInviteSuccess(null), 3000);
    } catch (err) {
      console.error("Failed to invite member:", err);
    } finally {
      setInviting(false);
    }
  };

  // Remove Member
  const handleRemoveMember = async (emailKey: string) => {
    if (!userId || !activeWorkspace) return;

    try {
      const wsDocRef = doc(db, "workspaces", activeWorkspace.id);
      const updatedMembers = { ...activeWorkspace.members };
      delete updatedMembers[emailKey];

      await updateDoc(wsDocRef, {
        members: updatedMembers,
      });

      const updatedWS = { ...activeWorkspace, members: updatedMembers };
      setWorkspaces((prev) => prev.map((w) => (w.id === activeWorkspace.id ? updatedWS : w)));
      setActiveWorkspace(updatedWS);
    } catch (err) {
      console.error("Failed to remove member:", err);
    }
  };

  // Switch Active Workspace
  const selectWorkspace = (ws: Workspace) => {
    setActiveWorkspace(ws);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <ShieldCheck className="h-4.5 w-4.5 text-[#F59E0B]" />;
      case "admin":
        return <ShieldAlert className="h-4.5 w-4.5 text-accent-primary" />;
      case "editor":
        return <UserCheck className="h-4.5 w-4.5 text-accent-cyan" />;
      case "viewer":
      default:
        return <Users className="h-4.5 w-4.5 text-foreground-muted" />;
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <Clock className="h-8 w-8 text-accent-primary animate-spin" />
        <p className="text-sm font-mono text-foreground-secondary">Resolving team scopes...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Team Workspaces
          </h1>
          <p className="mt-1 text-sm text-foreground-secondary">
            Collaborate on website watchlists, manage roles, and review shared change logs.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="gradient-bg-primary hover:shadow-[0_0_20px_rgba(59,130,246,0.35)] text-white px-5 h-11"
        >
          <Plus className="h-4 w-4" />
          <span>New Workspace</span>
        </Button>
      </div>

      {/* Main Workspace Layout split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Workspace Selector */}
        <div className="flex flex-col gap-4">
          <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-foreground-secondary">
            Available Workspaces ({workspaces.length})
          </h3>

          <div className="flex flex-col gap-3">
            {workspaces.map((ws) => {
              const isActive = activeWorkspace?.id === ws.id;
              const role = ws.members[userId ?? ""] || "viewer";

              return (
                <div
                  key={ws.id}
                  onClick={() => selectWorkspace(ws)}
                  className={`group rounded-2xl border p-4 transition-all flex items-center justify-between cursor-pointer ${
                    isActive
                      ? "border-accent-primary bg-accent-primary/[0.02] shadow-[0_0_15px_rgba(59,130,246,0.05)]"
                      : "border-border-glass bg-bg-glass hover:border-white/12 hover:bg-surface-elevated/10"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                      isActive ? "bg-accent-primary/10 border-accent-primary/20 text-accent-primary" : "bg-surface-elevated border-border-glass text-foreground-secondary"
                    }`}>
                      <Briefcase className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h4 className={`text-xs font-bold transition-colors group-hover:text-accent-primary ${isActive ? "text-accent-primary" : "text-foreground"}`}>
                        {ws.name}
                      </h4>
                      <p className="text-[10px] text-foreground-secondary font-mono capitalize">
                        Role: {role}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-foreground-muted group-hover:translate-x-0.5 transition-transform" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column (2/3 width) - Active Workspace Details & Members */}
        {activeWorkspace ? (
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Card className="bg-bg-glass border-border-glass">
              <CardHeader className="p-6 border-b border-border-glass">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-accent-primary" /> Workspace Settings: {activeWorkspace.name}
                </CardTitle>
                <CardDescription>
                  Configure shared permissions, invite colleagues, and view audit summaries.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                
                {/* 1. Add Team Member Invitation */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-foreground-secondary">
                    Invite Collaborator
                  </h4>
                  
                  {inviteSuccess && (
                    <div className="rounded-lg border border-success/20 bg-success/10 p-3 text-xs text-success font-semibold">
                      {inviteSuccess}
                    </div>
                  )}

                  <form onSubmit={handleInviteMember} className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
                      <Input
                        type="email"
                        placeholder="colleague@company.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="pl-10 h-10 text-xs"
                        required
                      />
                    </div>
                    
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as any)}
                      className="h-10 rounded-lg border border-border-glass bg-surface text-xs text-foreground px-3 outline-none focus:border-accent-primary"
                    >
                      <option value="admin">Admin (All Rights)</option>
                      <option value="editor">Editor (Can edit trackers)</option>
                      <option value="viewer">Viewer (Read logs only)</option>
                    </select>

                    <Button type="submit" disabled={inviting} className="gradient-bg-primary h-10 px-4 text-xs font-semibold">
                      <UserPlus className="h-4 w-4" />
                      <span>{inviting ? "Inviting..." : "Send Invite"}</span>
                    </Button>
                  </form>
                </div>

                {/* 2. Members List Table */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-foreground-secondary">
                    Active Team Members
                  </h4>

                  <div className="flex flex-col gap-2.5">
                    {Object.entries(activeWorkspace.members).map(([memberKey, role]) => {
                      const displayEmail = memberKey.replace(/_/g, ".");
                      const isSelf = displayEmail === user?.email || memberKey === userId;

                      return (
                        <div
                          key={memberKey}
                          className="flex items-center justify-between gap-4 p-3 rounded-xl border border-border-glass bg-white/[0.01]"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-surface flex items-center justify-center border border-border-glass">
                              {getRoleIcon(role)}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-foreground">
                                {isSelf ? `${profile?.displayName || "You"} (Owner)` : displayEmail}
                              </p>
                              <p className="text-[10px] text-foreground-muted capitalize">
                                Member Role: {role}
                              </p>
                            </div>
                          </div>

                          {!isSelf && role !== "owner" && (
                            <button
                              onClick={() => handleRemoveMember(memberKey)}
                              className="h-8 w-8 rounded-lg border border-border-glass bg-bg-glass text-error flex items-center justify-center hover:bg-error/10 hover:border-error/20 transition-all cursor-pointer"
                              title="Remove Member"
                            >
                              <UserMinus className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="lg:col-span-2 text-center py-20 border border-dashed border-border-glass rounded-2xl bg-bg-glass">
            <Users className="mx-auto h-12 w-12 text-foreground-muted mb-4" />
            <h3 className="text-sm font-bold text-foreground">No active workspace</h3>
            <p className="text-xs text-foreground-secondary mt-1">
              Select or build a workspace context to start team-based collaborations.
            </p>
          </div>
        )}
      </div>

      {/* Create Workspace Dialog Backdrop */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl border border-border-glass bg-surface p-6 shadow-2xl space-y-4"
          >
            <div>
              <h3 className="text-lg font-bold text-foreground">Create Team Workspace</h3>
              <p className="text-xs text-foreground-secondary mt-0.5">
                Set up a shared space for invite-only watchlist collaborations.
              </p>
            </div>

            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-foreground-secondary">
                  Workspace Name
                </label>
                <Input
                  placeholder="e.g. Acme Watchers"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  maxLength={40}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" onClick={() => setIsCreateOpen(false)} type="button">
                  Cancel
                </Button>
                <Button type="submit" disabled={creating} className="gradient-bg-primary text-white">
                  {creating ? "Creating..." : "Create Workspace"}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
