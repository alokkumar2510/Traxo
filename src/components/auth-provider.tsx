"use client";

import React, { useEffect, createContext, useContext } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";
import { Timestamp } from "firebase/firestore";
import { auth } from "@/services/firebase";
import { UserRepository } from "@/services/firestore/users";
import { useAuthStore } from "@/store/authStore";
import { UserProfile, UserPreferences } from "@/types/database";
import { logger } from "@/utils/logger";

const AuthContext = createContext<{
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
}>({
  user: null,
  profile: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

// Protected and Guest Route Lists
const PROTECTED_ROUTE_PREFIXES = ["/dashboard", "/settings", "/collections", "/trackers", "/history", "/marketplace", "/billing", "/workspaces", "/analytics", "/search"];
const GUEST_ROUTES = ["/login", "/register", "/forgot-password"];

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, loading, setAuthUser, setLoading, clearAuth } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        try {
          // Fetch custom user profile from Firestore
          let userProfile = await UserRepository.getUserProfile(firebaseUser.uid);

          if (!userProfile) {
            // New user registration / first-time Google Sign-in: initialize database records
            const now = Timestamp.now();
            userProfile = {
              id: firebaseUser.uid,
              email: firebaseUser.email || "",
              displayName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
              photoURL: firebaseUser.photoURL || undefined,
              plan: "free",
              provider: firebaseUser.providerData[0]?.providerId === "google.com" ? "google" : "email",
              emailVerified: firebaseUser.emailVerified,
              onboardingCompleted: false,
              createdAt: now,
              updatedAt: now,
            };

            await UserRepository.createUserProfile(userProfile);

            // Set up default preferences
            const defaultPrefs: UserPreferences = {
              theme: "dark",
              emailNotifications: true,
              telegramNotifications: false,
              defaultFrequency: "daily",
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
              updatedAt: now,
            };
            await UserRepository.saveUserPreferences(firebaseUser.uid, defaultPrefs);

            logger.info({
              service: "auth",
              event: "new_user_db_initialized",
              userId: firebaseUser.uid,
            });
          }

          setAuthUser(firebaseUser, userProfile);
          
          logger.info({
            service: "auth",
            event: "user_session_established",
            userId: firebaseUser.uid,
          });
        } catch (error) {
          logger.error({
            service: "auth",
            event: "sync_user_profile_failed",
            userId: firebaseUser.uid,
            error,
          });
          // Fallback to minimal state to avoid locking the UI completely
          setAuthUser(firebaseUser, null);
        }
      } else {
        clearAuth();
        logger.info({
          service: "auth",
          event: "user_session_cleared",
        });
      }
    });

    return () => unsubscribe();
  }, [setAuthUser, setLoading, clearAuth]);

  // Handle Route Guard Routing Rules
  useEffect(() => {
    if (loading) return;

    const isProtectedRoute = PROTECTED_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
    const isGuestRoute = GUEST_ROUTES.includes(pathname.replace(/\/$/, ""));

    if (isProtectedRoute && !user) {
      // Redirect unauthorized guests to login
      logger.info({
        service: "auth",
        event: "route_guard_redirect_to_login",
        metadata: { path: pathname },
      });
      router.push("/login");
    } else if (isGuestRoute && user) {
      // Redirect logged-in users to dashboard
      logger.info({
        service: "auth",
        event: "route_guard_redirect_to_dashboard",
        metadata: { path: pathname },
      });
      router.push("/dashboard");
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    // Return a luxurious, premium dark skeleton screen loading state instead of a spinner
    return (
      <div className="relative flex min-h-screen w-full items-center justify-center bg-background overflow-hidden">
        {/* Subtly moving gradient orbs */}
        <div className="absolute top-1/4 left-1/4 h-[300px] w-[300px] rounded-full bg-accent-primary/5 blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 h-[350px] w-[350px] rounded-full bg-accent-purple/5 blur-[140px] animate-pulse delay-700" />
        
        <div className="flex flex-col items-center gap-4 z-10">
          {/* Pulsing Traxo custom logo favicon */}
          <div className="relative w-16 h-16 rounded-2xl bg-surface-elevated border border-border-glass flex items-center justify-center overflow-hidden shadow-glow animate-pulse">
            <span className="text-3xl font-extrabold tracking-tighter gradient-text-primary">T</span>
            <div className="absolute inset-0 bg-gradient-to-tr from-accent-primary/20 to-accent-purple/20 mix-blend-overlay" />
          </div>
          <p className="text-sm font-mono tracking-widest text-foreground-secondary/70 animate-pulse">
            AUTHENTICATING SHELL...
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
