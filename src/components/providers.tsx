"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabase/client";

/**
 * Supabase Auth session provider (ADR-019) — replaces ClerkProvider +
 * ConvexProviderWithClerk. Admin status is `app_metadata.role === 'admin'`
 * (set server-side only; verified again in middleware and in every Edge Function).
 */

type SupabaseSessionState = {
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
};

const SessionContext = createContext<SupabaseSessionState>({
  session: null,
  isLoading: true,
  isAuthenticated: false,
  isAdmin: false,
});

export function useSupabaseSession(): SupabaseSessionState {
  return useContext(SessionContext);
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = supabaseBrowser();
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setIsLoading(false);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  const value = useMemo<SupabaseSessionState>(
    () => ({
      session,
      isLoading,
      isAuthenticated: session != null,
      isAdmin:
        (session?.user.app_metadata as Record<string, unknown> | undefined)?.role ===
        "admin",
    }),
    [session, isLoading],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
