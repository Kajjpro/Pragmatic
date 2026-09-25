"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { fetchMe } from "@/components/feed/feed-data";
import type { MeData } from "@/lib/types";

// GET /api/me-г нэг л удаа татаж бүх дэлгэцэд хуваалцана
// (дээд самбар, /feed, /predict, /me — тус бүр дахин татвал илүүдэл).
// Зочин бол fetchMe() null буцаана (401) — энэ нь алдаа биш.
type MeState = {
  me: MeData | null;
  loaded: boolean;
  refresh: () => void;
};

const MeContext = createContext<MeState>({
  me: null,
  loaded: false,
  refresh: () => {},
});

export function useMe() {
  return useContext(MeContext);
}

export function MeProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useUser();
  const [state, setState] = useState<{ loaded: boolean; me: MeData | null }>({
    loaded: false,
    me: null,
  });
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (!isLoaded) return;
    let cancelled = false;
    // Зочны хувьд ч дуудна — 401 ирээд null болно, салаа шаардлагагүй
    fetchMe().then((me) => {
      if (!cancelled) setState({ loaded: true, me });
    });
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, key]);

  // Үйлдэл хийсний дараа (таамаг, виктор) дахин татахад
  const refresh = useCallback(() => setKey((k) => k + 1), []);

  return (
    <MeContext.Provider value={{ me: state.me, loaded: state.loaded, refresh }}>
      {children}
    </MeContext.Provider>
  );
}
