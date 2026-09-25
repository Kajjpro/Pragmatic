"use client";

import { Sheet } from "@/components/ui/sheet";
import type { Persona } from "@/lib/types";

// "Би хэн бэ?" — анх орж ирэхэд гарах сонголт.
// Энэ нь зөвхөн ямар карт эхэлж харагдахыг тодорхойлно; хэзээ ч уншихыг хаахгүй.
const tiles: { persona: Persona; emoji: string; label: string }[] = [
  { persona: "STUDENT", emoji: "🎒", label: "Сурагч" },
  { persona: "DRIVER", emoji: "🚗", label: "Жолооч" },
  { persona: "WORKER", emoji: "💼", label: "Ажил хийдэг" },
  { persona: "PARENT", emoji: "👨‍👩‍👧", label: "Эцэг эх" },
];

export function PersonaSheet({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (p: Persona) => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Би хэн бэ?">
      <p className="text-[15px] leading-relaxed text-ink-600">
        Чамд хамгийн их хамаатай хуулиудыг эхэлж харуулна. Хэзээ ч солиж болно.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        {tiles.map((t) => (
          <button
            key={t.persona}
            type="button"
            onClick={() => onPick(t.persona)}
            className="press flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-ink-200 bg-white p-4 text-center hover:border-brand-500 hover:bg-brand-50"
          >
            <span className="text-[34px]" aria-hidden>
              {t.emoji}
            </span>
            <span className="text-[15px] font-extrabold text-ink-900">
              {t.label}
            </span>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onPick("ALL")}
        className="press mt-3 min-h-12 w-full rounded-2xl bg-ink-100 text-[15px] font-bold text-ink-700 hover:bg-ink-200"
      >
        Бүгдийг харах
      </button>
    </Sheet>
  );
}
