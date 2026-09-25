"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMe } from "./me-context";
import type { NotificationView } from "@/lib/types";

// Уншсан мэдэгдлийг тэмдэглэх API байхгүй тул аль мэдэгдлийг нээж үзснийг
// төхөөрөмж дээрээ санана. Ингэснээр тоолуур тэглэгдэнэ.
const SEEN_KEY = "hariu.seenNotifications.v1";

function readSeen(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function NotificationBell() {
  const { me } = useMe();
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState<string[]>([]);
  const reduce = useReducedMotion();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage бол гаднын сан; зөвхөн холбогдсоны дараа уншина
    setSeen(readSeen());
  }, []);

  const items: NotificationView[] = me?.notifications ?? [];
  const unread = items.filter((n) => !n.read && !seen.includes(n.id));

  // Нэвтрээгүй бол хонх харуулахгүй
  if (!me) return null;

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && items.length > 0) {
      // Нээхэд бүгдийг "үзсэн" гэж тэмдэглэнэ
      const ids = Array.from(new Set([...seen, ...items.map((n) => n.id)]));
      setSeen(ids);
      try {
        localStorage.setItem(SEEN_KEY, JSON.stringify(ids));
      } catch {
        // Хаалттай горимд хадгалахгүй — тоолуур дахин гарна
      }
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={`Мэдэгдэл${unread.length ? ` — ${unread.length} шинэ` : ""}`}
        aria-expanded={open}
        className="press relative grid h-10 w-10 place-items-center rounded-xl text-ink-700 hover:bg-ink-100"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
          <path
            d="M6 9a6 6 0 1 1 12 0c0 3.5.8 5.2 1.5 6H4.5C5.2 14.2 6 12.5 6 9Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path d="M9.5 18a2.5 2.5 0 0 0 5 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        {unread.length > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-bad-600 px-1 text-[11px] font-extrabold tabular-nums text-white">
            {unread.length}
          </span>
        ) : null}
      </button>

      <AnimatePresence>
        {open ? (
          <>
            {/* Гадуур дарвал хаагдана */}
            <button
              type="button"
              aria-label="Хаах"
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 cursor-default"
            />
            <motion.div
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="absolute right-0 z-50 mt-2 w-[min(88vw,22rem)] overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-lift"
            >
              <div className="border-b border-ink-100 px-4 py-3 text-[15px] font-extrabold text-ink-950">
                Мэдэгдэл
              </div>

              {items.length === 0 ? (
                <p className="px-4 py-6 text-center text-[14.5px] text-ink-600">
                  Одоогоор мэдэгдэл алга.
                </p>
              ) : (
                <ul className="max-h-80 overflow-y-auto">
                  {items.map((n) => {
                    const body = (
                      <>
                        <span className="text-[14.5px] font-semibold leading-snug text-ink-900">
                          {n.text}
                        </span>
                        <time className="mt-1 block text-[12.5px] text-ink-600">
                          {n.createdAt.slice(0, 10)}
                        </time>
                      </>
                    );
                    return (
                      <li key={n.id} className="border-b border-ink-100 last:border-0">
                        {n.link ? (
                          <Link
                            href={n.link}
                            onClick={() => setOpen(false)}
                            className="block px-4 py-3 transition-colors hover:bg-brand-50"
                          >
                            {body}
                          </Link>
                        ) : (
                          <div className="px-4 py-3">{body}</div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
