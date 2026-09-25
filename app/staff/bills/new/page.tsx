"use client";

// Ажилтан шинэ төсөл оруулна: одоогийн хууль + нэмэлт, өөрчлөлтийн төсөл + үндэслэл.
// "Харьцуулах" дарахад AI заалт бүрийн өөрчлөлтийг олж, иргэнд тайлбар бичээд DB-д хадгална.
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { stageLabels, type Stage } from "@/lib/mock";

const STAGES: Stage[] = ["DISCUSS_DECISION", "FIRST_READING", "FINAL_READING", "FINAL_APPROVAL"];

export default function NewBillPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [stage, setStage] = useState<Stage>("FIRST_READING");
  const [currentLawText, setCurrentLawText] = useState("");
  const [amendmentText, setAmendmentText] = useState("");
  const [reasonText, setReasonText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, stage, currentLawText, amendmentText, reasonText }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Алдаа гарлаа");
        setLoading(false);
        return;
      }
      router.push(`/staff/bills/${data.id}`);
    } catch {
      setError("Сервертэй холбогдож чадсангүй");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-5">
      <nav className="flex items-center gap-2 text-[12px] text-ink-500">
        <Link href="/staff" className="hover:text-parliament-700">
          Ажлын самбар
        </Link>
        <span>/</span>
        <span className="text-parliament-900">Шинэ төсөл</span>
      </nav>

      <form
        onSubmit={submit}
        className="flex flex-col gap-4 rounded-2xl border border-ink-100 bg-white p-5 shadow-[0_20px_45px_-30px_rgba(15,42,99,0.3)]"
      >
        <h1 className="font-editorial text-2xl font-medium text-parliament-900">Шинэ төсөл оруулах</h1>

        <Field label="Төслийн нэр">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Жишээ: Нийгмийн даатгалын ерөнхий хуульд нэмэлт, өөрчлөлт оруулах тухай"
            className={inputClass}
          />
        </Field>

        <Field label="Хэлэлцүүлгийн үе шат">
          <select value={stage} onChange={(e) => setStage(e.target.value as Stage)} className={inputClass}>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {stageLabels[s]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Одоо мөрдөж буй хууль" hint="legalinfo.mn-ээс хуулна. Нэг заалт нэг мөрөнд (3.1.…, 3.2.…).">
          <textarea value={currentLawText} onChange={(e) => setCurrentLawText(e.target.value)} rows={8} className={inputClass} />
        </Field>

        <Field label="Нэмэлт, өөрчлөлтийн төсөл" hint="«…гэснийг …гэж өөрчилсүгэй» гэх мэт заалтуудтай текст.">
          <textarea value={amendmentText} onChange={(e) => setAmendmentText(e.target.value)} rows={8} className={inputClass} />
        </Field>

        <Field label="Төслийн үндэслэл, танилцуулга" hint="Иргэнд «Яагаад» хэсгийг ЗӨВХӨН эндээс тайлбарлана.">
          <textarea value={reasonText} onChange={(e) => setReasonText(e.target.value)} rows={5} className={inputClass} />
        </Field>

        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-[12.5px] text-rose-800">{error}</div>
        ) : null}

        <div className="flex items-center justify-end gap-3">
          {loading ? (
            <span className="text-[12px] text-ink-500">AI төслийг уншиж, заалт бүрийг харьцуулж байна… (1–2 минут)</span>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-parliament-700 px-5 py-2 text-[12.5px] font-semibold text-white transition hover:bg-parliament-800 disabled:opacity-60"
          >
            {loading ? "Ажиллаж байна…" : "Харьцуулах"}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-ink-100 bg-parliament-50/40 px-3 py-2 text-[13px] leading-relaxed outline-none transition focus:border-parliament-500 focus:bg-white";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] font-semibold text-parliament-900">{label}</span>
      {children}
      {hint ? <span className="text-[11px] text-ink-500">{hint}</span> : null}
    </label>
  );
}
