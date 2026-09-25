"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PERSONAS, personaLabels, type Persona } from "@/lib/types";

// Анх орж ирэхэд: "Таныг юу хамгийн их сонирхож байна вэ?" (радио жагсаалт)
export function PersonaSelect({
  initial,
  onPick,
  onCancel,
}: {
  initial: Persona | null;
  onPick: (p: Persona) => void;
  onCancel?: () => void;
}) {
  const [value, setValue] = useState<Persona>(initial ?? "ALL");
  // "Бүгд"-ийг сүүлд харуулна
  const order: Persona[] = [...PERSONAS.filter((p) => p !== "ALL"), "ALL"];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onPick(value);
      }}
      className="rounded-lg border border-line bg-surface p-5 sm:p-6"
    >
      <fieldset>
        <legend className="font-serif text-[21px] font-bold text-heading">Таныг юу хамгийн их сонирхож байна вэ?</legend>
        <p className="mt-1 text-[15px] text-muted">Сонголтоор танд хамааралтай өөрчлөлтүүдийг эхэнд харуулна. Дараа нь солих боломжтой.</p>
        <div className="mt-4 flex flex-col gap-2">
          {order.map((p) => (
            <label
              key={p}
              className="flex min-h-12 cursor-pointer items-center gap-3 rounded-md border border-line px-4 has-[:checked]:border-primary has-[:checked]:bg-surface-2"
            >
              <input
                type="radio"
                name="persona"
                value={p}
                checked={value === p}
                onChange={() => setValue(p)}
                className="h-4 w-4 accent-[var(--primary)]"
              />
              <span className="text-[16px]">{personaLabels[p]}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button type="submit">Үргэлжлүүлэх</Button>
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Болих
          </Button>
        ) : null}
      </div>
    </form>
  );
}
