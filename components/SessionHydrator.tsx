"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/store/auth";

export default function SessionHydrator() {
  const refresh = useAuthStore((s) => s.refresh);

  useEffect(() => {
    refresh();

    const onFocus = () => refresh();
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refresh]);

  return null;
}
