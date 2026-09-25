"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useMe } from "./me-context";
import type { NotificationView } from "@/lib/types";

// Уншсан мэдэгдлийг тэмдэглэх API байхгүй тул нээж үзснийг төхөөрөмж дээр санана.
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage-г зөвхөн хөтөч дээр уншина
    setSeen(readSeen());
  }, []);

  // Нэвтрээгүй бол хонх харуулахгүй
  if (!me) return null;

  const items: NotificationView[] = me.notifications ?? [];
  const unread = items.filter((n) => !n.read && !seen.includes(n.id));

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && items.length > 0) {
      const ids = Array.from(new Set([...seen, ...items.map((n) => n.id)]));
      setSeen(ids);
      try {
        localStorage.setItem(SEEN_KEY, JSON.stringify(ids));
      } catch {
        // Хаалттай горимд хадгалахгүй
      }
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={`Мэдэгдэл${unread.length ? `, ${unread.length} шинэ` : ""}`}
        aria-expanded={open}
        className="relative grid h-9 w-9 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-fg"
      >
        <Bell aria-hidden className="h-5 w-5" strokeWidth={1.75} />
        {unread.length > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-bad-fg px-1 text-[11px] font-semibold tabular-nums text-white">
            {unread.length}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          <button type="button" aria-label="Хаах" onClick={() => setOpen(false)} className="fixed inset-0 z-40 cursor-default" />
          <div className="absolute right-0 z-50 mt-2 w-[min(88vw,22rem)] animate-fade-in overflow-hidden rounded-lg border border-line bg-surface shadow-lift">
            <div className="border-b border-line px-4 py-3 font-serif text-[16px] font-bold text-heading">Мэдэгдэл</div>
            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-[14.5px] text-muted">Одоогоор мэдэгдэл алга.</p>
            ) : (
              <ul className="max-h-80 overflow-y-auto">
                {items.map((n) => {
                  const body = (
                    <>
                      <span className="text-[14.5px] leading-snug text-fg">{n.text}</span>
                      <time dateTime={n.createdAt} className="mt-1 block text-[12.5px] tabular-nums text-muted">
                        {n.createdAt.slice(0, 10)}
                      </time>
                    </>
                  );
                  return (
                    <li key={n.id} className="border-b border-line last:border-0">
                      {n.link ? (
                        <Link href={n.link} onClick={() => setOpen(false)} className="block px-4 py-3 hover:bg-surface-2">
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
          </div>
        </>
      ) : null}
    </div>
  );
}
