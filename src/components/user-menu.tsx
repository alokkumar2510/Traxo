"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { signOut } from "firebase/auth";
import { LogOut, Settings, User, CreditCard } from "lucide-react";
import { auth } from "@/services/firebase";
import { useAuthStore } from "@/store/authStore";
import { logger } from "@/utils/logger";

export default function UserMenu() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      logger.info({
        service: "auth",
        event: "user_logged_out",
      });
      router.push("/login");
    } catch (error) {
      logger.error({
        service: "auth",
        event: "logout_failed",
        error,
      });
    }
  };

  const getInitials = () => {
    if (!profile?.displayName) return "U";
    return profile.displayName.charAt(0).toUpperCase();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        id="user-profile-menu-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full border border-border-glass p-0.5 hover:border-white/15 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
      >
        {profile?.photoURL ? (
          <img
            src={profile.photoURL}
            alt={profile.displayName}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-elevated text-xs font-bold text-foreground-secondary border border-border-glass">
            {getInitials()}
          </div>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-56 rounded-xl border border-border-glass bg-surface/90 backdrop-blur-2xl p-2 shadow-large z-50 overflow-hidden"
          >
            {/* User Details */}
            <div className="px-3 py-2.5 border-b border-border-glass mb-1.5">
              <p className="text-sm font-semibold text-foreground truncate">
                {profile?.displayName || "Traxo User"}
              </p>
              <p className="text-xs text-foreground-secondary truncate mb-2">
                {profile?.email || "user@example.com"}
              </p>
              <span className="inline-flex items-center rounded-full bg-accent-primary/10 border border-accent-primary/25 px-2 py-0.5 text-[10px] font-medium tracking-wide text-accent-primary uppercase">
                {profile?.plan || "free"} plan
              </span>
            </div>

            {/* Links */}
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push("/settings");
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-foreground-secondary hover:bg-surface-elevated hover:text-foreground transition-colors cursor-pointer"
              >
                <User className="h-4 w-4 text-foreground-muted" />
                <span>My Profile</span>
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push("/settings?tab=notifications");
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-foreground-secondary hover:bg-surface-elevated hover:text-foreground transition-colors cursor-pointer"
              >
                <Settings className="h-4 w-4 text-foreground-muted" />
                <span>Preferences</span>
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push("/settings?tab=billing");
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-foreground-secondary hover:bg-surface-elevated hover:text-foreground transition-colors cursor-pointer"
              >
                <CreditCard className="h-4 w-4 text-foreground-muted" />
                <span>Billing</span>
              </button>
            </div>

            <div className="h-[1px] bg-border-glass my-1.5" />

            {/* Logout */}
            <button
              onClick={() => {
                setIsOpen(false);
                handleLogout();
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-error hover:bg-error/10 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4 text-error" />
              <span>Log Out</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
