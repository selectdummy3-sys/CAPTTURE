import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";

import { appUrl, supabase } from "@/lib/supabase";
import type { Profile, Seller } from "@/types";

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  seller: Seller | null;
  isLoading: boolean;
  isAdmin: boolean;
  isApprovedSeller: boolean;
  hasSellerApplication: boolean;
  signUp: (input: { email: string; password: string; fullName: string }) => Promise<{ needsEmailVerification: boolean; error: string | null }>;
  signIn: (input: { email: string; password: string }) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    const [{ data: profileData }, { data: sellerData }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase
        .from("sellers")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);
    setProfile(profileData ?? null);
    setSeller(sellerData ?? null);
  }, []);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    setUser(data.session?.user ?? null);
    if (data.session?.user) {
      await loadProfile(data.session.user.id);
    } else {
      setProfile(null);
      setSeller(null);
    }
  }, [loadProfile]);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      setIsLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!active) return;
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadProfile(session.user.id);
        }
      } catch {
        // silently handle auth bootstrap errors
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
      if (session?.user) {
        void loadProfile(session.user.id);
      } else {
        setProfile(null);
        setSeller(null);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      seller,
      isLoading,
      isAdmin: profile?.role === "admin",
      isApprovedSeller: profile?.role === "seller" && seller?.application_status === "approved",
      hasSellerApplication: seller != null,
      signUp: async ({ email, password, fullName }) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${appUrl}/auth/callback`,
          },
        });
        if (error) return { needsEmailVerification: false, error: error.message };
        return {
          needsEmailVerification: data.session == null,
          error: null,
        };
      },
      signIn: async ({ email, password }) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error?.message ?? null };
      },
      signOut: async () => {
        await supabase.auth.signOut();
      },
      resetPassword: async (email) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${appUrl}/auth/reset-password`,
        });
        return { error: error?.message ?? null };
      },
      updatePassword: async (password) => {
        const { error } = await supabase.auth.updateUser({ password });
        return { error: error?.message ?? null };
      },
      refresh,
    }),
    [user, profile, seller, isLoading, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export type { Session };
