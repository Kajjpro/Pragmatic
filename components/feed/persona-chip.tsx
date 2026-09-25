"use client";

import { personaLabels, type Persona } from "@/lib/types";

// Фийдийн дээд талын жижиг чип — дарвал бүлгээ солино.
const emoji: Record<Persona, string> = {
  STUDENT: "🎒",
  DRIVER: "🚗",
  WORKER: "💼",
  PARENT: "👨‍👩‍👧",
  ALL: "🌍",
};

export function PersonaChip({
  persona,
  onClick,
}: {
  persona: Persona;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="press inline-flex min-h-10 items-center gap-2 rounded-full border-2 border-ink-200 bg-white px-3.5 text-[14px] font-bold text-ink-900 hover:border-brand-400 hover:text-brand-700"
    >
      <span aria-hidden>{emoji[persona]}</span>
      {personaLabels[persona]}
      <span className="text-[12px] font-semibold text-ink-500">солих</span>
    </button>
  );
}
