"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { stageLabels, stageOrder } from "@/lib/labels";

const inputClass =
  "w-full rounded-xl border border-ink-100 bg-white px-3.5 py-2.5 text-[13px] text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-parliament-500 disabled:bg-parliament-50/40";

export function NewBillForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    // 1. Маягтын талбаруудыг уншина
    const form = new FormData(e.currentTarget);
    const body = {
      title: form.get("title"),
      stage: form.get("stage"),
      currentLawText: form.get("currentLawText"),
      amendmentText: form.get("amendmentText"),
      reasonText: form.get("reasonText"),
    };

    try {
      // 2. Сервер рүү илгээнэ (AI заалт бүрээр харьцуулна, 1–3 минут)
      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);

      // 3. Алдаа гарвал серверийн монгол текстийг харуулна
      if (!res.ok || !data?.id) {
        setError(data?.error ?? "Төсөл үүсгэж чадсангүй. Дахин оролдоно уу.");
        setBusy(false);
        return;
      }

      // 4. Амжилттай бол шинэ төслийн ажлын ширээ рүү шилжинэ
      router.push(`/staff/bills/${data.id}`);
    } catch {
      setError("Сервертэй холбогдож чадсангүй. Интернэтээ шалгаад дахин оролдоно уу.");
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-2xl border border-ink-100 bg-white p-6 shadow-[0_20px_45px_-30px_rgba(15,42,99,0.3)]"
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-[1fr_260px]">
        <Field label="Төслийн нэр">
          <input
            name="title"
            required
            maxLength={300}
            disabled={busy}
            placeholder="Жишээ нь: Хувь хүний орлогын албан татварын тухай хуульд нэмэлт, өөрчлөлт оруулах тухай"
            className={inputClass}
          />
        </Field>
        <Field label="Шат">
          <select name="stage" disabled={busy} className={inputClass}>
            {stageOrder.map((s) => (
              <option key={s} value={s}>
                {stageLabels[s]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Field label="Одоогийн хуулийн текст" hint="Хуулийн бүтэн текстийг хуулж тавина.">
          <textarea
            name="currentLawText"
            required
            rows={16}
            disabled={busy}
            className={inputClass}
          />
        </Field>
        <Field
          label="Нэмэлт, өөрчлөлтийн төсөл"
          hint="“…заалтын … гэснийг … гэж өөрчилсүгэй” гэх мэт зүйлүүд."
        >
          <textarea
            name="amendmentText"
            required
            rows={16}
            disabled={busy}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Үндэслэл, тайлбар" hint="Заавал биш. AI иргэнд “яагаад” гэдгийг тайлбарлахад ашиглана.">
        <textarea name="reasonText" rows={6} disabled={busy} className={inputClass} />
      </Field>

      {error ? (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-[13px] font-medium text-rose-800">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-3">
        {busy ? (
          <p className="text-[12.5px] text-ink-500">
            AI төслийг заалт бүрээр харьцуулж байна… 1–3 минут болно.
          </p>
        ) : null}
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full bg-parliament-700 px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-parliament-800 disabled:cursor-wait disabled:opacity-60"
        >
          {busy ? "Харьцуулж байна…" : "Харьцуулалт үүсгэх"}
        </button>
      </div>
    </form>
  );
}

// Нэг талбарын гарчиг + тайлбар
function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12.5px] font-semibold text-parliament-900">{label}</span>
      {hint ? <span className="text-[11.5px] text-ink-500">{hint}</span> : null}
      {children}
    </label>
  );
}
