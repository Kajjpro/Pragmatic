"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { fetchMe } from "@/components/feed/feed-data";
import { PROGRESS_EVENT, readProgress, today, yesterdayOf, type Progress } from "@/components/feed/progress-store";
import type { MeData } from "@/lib/types";

// GET /api/me-г нэг л удаа татаж бүх дэлгэцэд хуваалцана
// (дээд самбар, /feed, /predict, /me — тус бүр дахин татвал илүүдэл).
// Зочин бол fetchMe() null буцаана (401) — энэ нь алдаа биш; зочны явц төхөөрөмж дээр (progress-store).
type MeState = {
  me: MeData | null;
  loaded: boolean;
  guest: Progress | null; // нэвтрээгүй үеийн явц
  refresh: () => void;
  patch: (next: Partial<MeData>) => void; // API-ийн хариугаар шууд шинэчлэх (дахин татахгүй)
};

const MeContext = createContext<MeState>({
  me: null,
  loaded: false,
  guest: null,
  refresh: () => {},
  patch: () => {},
});

export function useMe() {
  return useContext(MeContext);
}

// Толгой, streak цонхонд: нэвтэрсэн бол серверийн, үгүй бол төхөөрөмжийн тоо
export type Score = {
  signedIn: boolean;
  points: number;
  streak: number;
  lastActiveDay: string | null; // цувралын сүүлийн өдөр
  viewedToday: number;
};

export function useScore(): Score {
  const { me, guest } = useMe();
  if (me) {
    const day = today();
    const lastActiveDay = me.activeToday ? day : me.streak > 0 ? yesterdayOf(day) : null;
    return {
      signedIn: true,
      points: me.points,
      streak: me.streak,
      lastActiveDay,
      viewedToday: me.viewedCardIdsToday?.length ?? 0,
    };
  }
  return {
    signedIn: false,
    points: guest?.points ?? 0,
    streak: guest?.streak ?? 0,
    lastActiveDay: guest?.lastActiveDay ?? null,
    viewedToday: guest?.viewedToday.length ?? 0,
  };
}

export function MeProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useUser();
  const [state, setState] = useState<{ loaded: boolean; me: MeData | null }>({
    loaded: false,
    me: null,
  });
  const [guest, setGuest] = useState<Progress | null>(null);
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

  // Зочны явцыг уншиж, өөрчлөгдөх бүрд дахин уншина
  useEffect(() => {
    const read = () => setGuest(readProgress());
    read();
    window.addEventListener(PROGRESS_EVENT, read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener(PROGRESS_EVENT, read);
      window.removeEventListener("storage", read);
    };
  }, []);

  // Үйлдэл хийсний дараа (таамаг, виктор) дахин татахад
  const refresh = useCallback(() => setKey((k) => k + 1), []);
  const patch = useCallback(
    (next: Partial<MeData>) => setState((s) => (s.me ? { ...s, me: { ...s.me, ...next } } : s)),
    [],
  );

  return (
    <MeContext.Provider value={{ me: state.me, loaded: state.loaded, guest, refresh, patch }}>
      {children}
    </MeContext.Provider>
  );
}
