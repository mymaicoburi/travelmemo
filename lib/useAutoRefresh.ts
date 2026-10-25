"use client";

import { useCallback, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";

const AUTO_THROTTLE_MS = 5000;
const MANUAL_THROTTLE_MS = 1000;

export function useAutoRefresh() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const lastRefreshRef = useRef<number>(0);
  const isPendingRef = useRef<boolean>(false);

  // Keep isPendingRef in sync with transition state
  isPendingRef.current = isPending;

  const refresh = useCallback(
    (manual = false) => {
      const now = Date.now();
      const throttleLimit = manual ? MANUAL_THROTTLE_MS : AUTO_THROTTLE_MS;

      // If a refresh is in-flight or within the throttle window, skip
      if (isPendingRef.current || now - lastRefreshRef.current < throttleLimit) {
        return;
      }

      lastRefreshRef.current = now;
      startTransition(() => {
        router.refresh();
      });
    },
    [router]
  );

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refresh(false);
      }
    };

    const onFocus = () => {
      refresh(false);
    };

    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        refresh(false);
      }
    };

    const onOnline = () => {
      refresh(false);
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onFocus);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("online", onOnline);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("online", onOnline);
    };
  }, [refresh]);

  return { refresh, isPending };
}
