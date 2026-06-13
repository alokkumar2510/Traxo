"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserPlus,
  Trash2,
  Crown,
  ShieldCheck,
  Eye,
  Code2,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Copy,
  Check,
  Settings,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import {
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import Link from "next/link";

type MemberRole = "admin" | "developer" | "viewer";
type MemberStatus = "pending" | "active";

interface TeamMember {
  id: string;
  email: string;
  role: MemberRole;
  status: MemberStatus;
  createdAt: any;
}

const ROLE_CONFIG: Record<MemberRole, { label: string; icon: React.ReactNode; color: string; bg: string; desc: string }> = {
  admin: {
    label: "Administrator",
    icon: <ShieldCheck className="h-3.5 w-3.5" />,
    color: "#8B5CF6",
    bg: "rgba(139,92,246,0.12)",
    desc: "Full access to billing, settings, and all trackers",
  },
  developer: {
    label: "Developer",
    icon: <Code2 className="h-3.5 w-3.5" />,
    color: "#3B82F6",
    bg: "rgba(59,130,246,0.12)",
    desc: "Can create, manage, and configure trackers",
  },
  viewer: {
    label: "Viewer",
    icon: <Eye className="h-3.5 w-3.5" />,
    color: "#22C55E",
    bg: "rgba(34,197,94,0.12)",
    desc: "Read-only access to trackers and analytics",
  },
};

export default function TeamPage() {
  const { user, profile } = useAuthStore();
  const userId = user?.uid;

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<MemberRole>("viewer");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const unsub = onSnapshot(collection(db, "users", userId, "team"), (snap) => {
      setMembers(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TeamMember));
      setLoading(false);
    });
    return () => unsub();
  }, [userId]);

  const handleInvite = async (e: React.FormEvent) => {
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
      setInviteSuccess(true);
      setTimeout(() => setInviteSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!userId) return;
    await deleteDoc(doc(db, "users", userId, "team", memberId));
  };

  const handleRoleChange = async (memberId: string, newRole: MemberRole) => {
    if (!userId) return;
    await updateDoc(doc(db, "users", userId, "team", memberId), { role: newRole });
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(`https://traxo.alokkumarsahu.in/register?ref=${userId}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const totalMembers = members.length + 1; // +1 for owner
  const pendingCount = members.filter((m) => m.status === "pending").length;
  const activeCount = members.filter((m) => m.status === "active").length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team</h1>
          <p className="mt-1 text-sm text-foreground-secondary">
            Collaborate with your teammates and manage workspace access.
          </p>
        </div>
        <Link
          href="/settings?tab=team"
          className="flex h-9 items-center gap-2 rounded-xl border border-border-glass bg-bg-glass px-3 text-[12px] font-medium text-foreground-secondary hover:text-foreground transition-colors"
        >
          <Settings className="h-3.5 w-3.5" />
          Team Settings
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Members", value: totalMembers, icon: <Users className="h-4 w-4 text-white" />, bg: "linear-gradient(135deg,#7C3AED,#8B5CF6)" },
          { label: "Active Members", value: activeCount + 1, icon: <CheckCircle className="h-4 w-4 text-white" />, bg: "linear-gradient(135deg,#16A34A,#22C55E)" },
          { label: "Pending Invites", value: pendingCount, icon: <Clock className="h-4 w-4 text-white" />, bg: "linear-gradient(135deg,#D97706,#F59E0B)" },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-4 flex items-center gap-3"
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ background: stat.bg }}
            >
              {stat.icon}
            </div>
            <div>
              <p className="text-[11px] text-foreground-secondary">{stat.label}</p>
              <p className="text-xl font-bold text-foreground">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_340px]">
        {/* Members List */}
        <div className="glass-card rounded-2xl p-5">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-foreground">Workspace Members</h2>
            <span className="rounded-full bg-surface-elevated border border-border-glass px-2 py-0.5 text-[11px] text-foreground-secondary">
              {totalMembers} {totalMembers === 1 ? "member" : "members"}
            </span>
          </div>

          <div className="divide-y divide-border-glass/30 rounded-xl border border-border-glass overflow-hidden">
            {/* Owner row */}
            <div className="flex items-center justify-between gap-3 p-4 bg-surface-elevated/30">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-primary to-accent-purple">
                  {profile?.photoURL ? (
                    <img src={profile.photoURL} alt="" className="h-full w-full object-cover rounded-full" />
                  ) : (
                    <span className="text-sm font-bold text-white">
                      {profile?.displayName?.[0]?.toUpperCase() ?? "O"}
                    </span>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#F59E0B] shadow-sm">
                    <Crown className="h-2.5 w-2.5 text-white" />
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-foreground truncate">
                    {profile?.displayName ?? "Workspace Owner"}
                  </p>
                  <p className="text-[11px] text-foreground-secondary truncate">{profile?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="rounded-full bg-[rgba(245,158,11,0.12)] border border-[rgba(245,158,11,0.3)] px-2.5 py-1 text-[10px] font-bold text-[#F59E0B] uppercase tracking-wide">
                  Owner
                </span>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center p-10">
                <Loader2 className="h-5 w-5 text-accent-purple animate-spin" />
              </div>
            ) : members.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-elevated border border-border-glass">
                  <UserPlus className="h-5 w-5 text-foreground-muted" />
                </div>
                <p className="text-[13px] font-medium text-foreground">No team members yet</p>
                <p className="mt-1 text-[11px] text-foreground-secondary max-w-xs">
                  Invite coworkers and collaborators to your workspace using the form on the right.
                </p>
              </div>
            ) : (
              members.map((member) => {
                const roleConfig = ROLE_CONFIG[member.role];
                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-between gap-3 p-4 hover:bg-surface-elevated/20 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-elevated border border-border-glass text-sm font-bold text-foreground-secondary">
                        {member.email[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-foreground truncate">
                          {member.email.split("@")[0]}
                        </p>
                        <p className="text-[11px] text-foreground-secondary truncate">{member.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Status badge */}
                      <span
                        className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide border ${
                          member.status === "pending"
                            ? "bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.3)] text-[#F59E0B]"
                            : "bg-[rgba(34,197,94,0.1)] border-[rgba(34,197,94,0.3)] text-[#22C55E]"
                        }`}
                      >
                        {member.status === "pending" ? <Clock className="h-2.5 w-2.5" /> : <CheckCircle className="h-2.5 w-2.5" />}
                        {member.status}
                      </span>

                      {/* Role selector */}
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value as MemberRole)}
                        className="h-7 rounded-lg border border-border-glass bg-surface px-2 text-[11px] text-foreground outline-none cursor-pointer hover:border-accent-purple/30 transition-colors"
                      >
                        <option value="viewer" className="bg-surface">Viewer</option>
                        <option value="developer" className="bg-surface">Developer</option>
                        <option value="admin" className="bg-surface">Admin</option>
                      </select>

                      <button
                        onClick={() => handleRemove(member.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-error/20 text-error hover:bg-error/10 transition-colors cursor-pointer"
                        title="Remove member"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Invite Panel */}
        <div className="flex flex-col gap-4">
          {/* Invite Form */}
          <div className="glass-card rounded-2xl p-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-purple/15 border border-accent-purple/25">
                <UserPlus className="h-4 w-4 text-accent-purple" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-foreground">Invite Member</h3>
                <p className="text-[11px] text-foreground-secondary">Send a workspace invitation</p>
              </div>
            </div>

            <form onSubmit={handleInvite} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-foreground-secondary">
                  Email Address
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-border-glass bg-bg-glass px-3 focus-within:border-accent-purple/40 focus-within:ring-1 focus-within:ring-accent-purple/20 transition-all">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-foreground-muted" />
                  <input
                    type="email"
                    required
                    placeholder="colleague@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="h-10 flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-foreground-muted"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-foreground-secondary">
                  Workspace Role
                </label>
                <div className="space-y-2">
                  {(Object.entries(ROLE_CONFIG) as [MemberRole, typeof ROLE_CONFIG[MemberRole]][]).map(([roleKey, config]) => (
                    <button
                      key={roleKey}
                      type="button"
                      onClick={() => setInviteRole(roleKey)}
                      className={`w-full flex items-start gap-3 rounded-xl border p-3 text-left transition-all cursor-pointer ${
                        inviteRole === roleKey
                          ? "border-accent-purple/40 bg-accent-purple/10"
                          : "border-border-glass bg-bg-glass hover:border-border-glass/80"
                      }`}
                    >
                      <div
                        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: config.bg, color: config.color }}
                      >
                        {config.icon}
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold text-foreground">{config.label}</p>
                        <p className="text-[10px] text-foreground-secondary">{config.desc}</p>
                      </div>
                      {inviteRole === roleKey && (
                        <Check className="ml-auto mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-purple" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <AnimatePresence>
                {inviteSuccess && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 rounded-lg bg-success/10 border border-success/25 px-3 py-2 text-[11px] text-success"
                  >
                    <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                    Invitation recorded successfully!
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={inviteLoading || !inviteEmail.trim()}
                className="w-full h-9 rounded-xl bg-accent-purple text-[12px] font-semibold text-white hover:bg-accent-purple/90 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {inviteLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <UserPlus className="h-3.5 w-3.5" />
                )}
                {inviteLoading ? "Sending..." : "Send Invitation"}
              </button>
            </form>
          </div>

          {/* Invite Link */}
          <div className="glass-card rounded-2xl p-4">
            <h3 className="mb-2 text-[13px] font-semibold text-foreground">Invite Link</h3>
            <p className="mb-3 text-[11px] text-foreground-secondary">
              Share this link to let anyone register and join your workspace.
            </p>
            <div className="flex items-center gap-2 rounded-xl border border-border-glass bg-bg-glass px-3 py-2">
              <p className="flex-1 truncate text-[11px] text-foreground-muted font-mono">
                traxo.alokkumarsahu.in/register?ref={userId?.slice(0, 8)}...
              </p>
              <button
                onClick={copyInviteLink}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-border-glass bg-surface text-foreground-secondary hover:text-foreground transition-colors cursor-pointer"
              >
                {copiedLink ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          </div>

          {/* Role Legend */}
          <div className="glass-card rounded-2xl p-4">
            <h3 className="mb-3 text-[13px] font-semibold text-foreground">Role Permissions</h3>
            <div className="space-y-2.5">
              {(Object.entries(ROLE_CONFIG) as [MemberRole, typeof ROLE_CONFIG[MemberRole]][]).map(([roleKey, config]) => (
                <div key={roleKey} className="flex items-center gap-2.5">
                  <div
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: config.bg, color: config.color }}
                  >
                    {config.icon}
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-foreground">{config.label}</p>
                    <p className="text-[10px] text-foreground-secondary">{config.desc}</p>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2.5">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[rgba(245,158,11,0.12)]">
                  <Crown className="h-3.5 w-3.5 text-[#F59E0B]" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-foreground">Owner</p>
                  <p className="text-[10px] text-foreground-secondary">Full control including account deletion</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
