"use client";

import { useCallback, useEffect, useState } from "react";
import { useSupabaseSession } from "@/components/providers";
import { chefAdmin } from "@/lib/chef-api";

type State<T> = {
  data: T | undefined;
  error: string | null;
  isLoading: boolean;
  refetch: () => void;
};

/**
 * Small read-only data hook for admin surfaces: calls a chef-admin action, tracks
 * loading/error, and re-runs on demand or on a poll interval. Mirrors the manual
 * fetch/poll pattern in recipes-page-content.tsx without the per-page boilerplate.
 *
 * When `pollMs` is set, ticks are skipped while the document is hidden so a
 * background admin tab does not keep hammering chef-admin (egress / DB slots).
 */
export function useChefQuery<T>(
  action: string,
  args: Record<string, unknown> = {},
  options: { pollMs?: number } = {},
): State<T> {
  const { isAuthenticated } = useSupabaseSession();
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [version, setVersion] = useState(0);

  const refetch = useCallback(() => setVersion((v) => v + 1), []);
  const argsKey = JSON.stringify(args);
  const { pollMs } = options;

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    const load = async () => {
      try {
        const result = await chefAdmin<T>(action, JSON.parse(argsKey));
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Request failed");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();

    if (!pollMs) {
      return () => {
        cancelled = true;
      };
    }

    const tick = () => {
      if (typeof document !== "undefined" && document.hidden) return;
      void load();
    };
    const timer = setInterval(tick, pollMs);
    const onVisibility = () => {
      if (!document.hidden) void load();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [isAuthenticated, action, argsKey, version, pollMs]);

  return { data, error, isLoading, refetch };
}
