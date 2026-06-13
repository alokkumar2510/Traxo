import { create } from "zustand";
import { User as FirebaseUser } from "firebase/auth";
import { UserProfile } from "@/types/database";

interface AuthState {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  setAuthUser: (user: FirebaseUser | null, profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: true,
  setAuthUser: (user, profile) => set({ user, profile, loading: false }),
  setLoading: (loading) => set({ loading }),
  clearAuth: () => set({ user: null, profile: null, loading: false }),
}));
