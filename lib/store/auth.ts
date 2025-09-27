import { create } from "zustand";

export type AuthUser = {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export type AuthSession = {
  user?: AuthUser | null;
  expires?: string;
} | null;

interface AuthState {
  session: AuthSession;
  loading: boolean;
  error?: string | null;
  setSession: (session: AuthSession) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  refresh: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  loading: false,
  error: null,
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  refresh: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch("/api/auth/session", { credentials: "include" });
      if (!res.ok) throw new Error(`Failed to load session: ${res.status}`);
      const data = await res.json();
      set({ session: data ?? null });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Unknown error", session: null });
    } finally {
      set({ loading: false });
    }
  },
}));

export const selectIsAuthenticated = (s: AuthState) => Boolean(s.session?.user?.email);
export const selectUser = (s: AuthState) => s.session?.user ?? null;
