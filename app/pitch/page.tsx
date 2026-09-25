"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

type Slide = {
  eyebrow: string;
  title: string;
  body: React.ReactNode;
};

const slides: Slide[] = [
  {
    eyebrow: "Слайд 1 · Асуудал",
    title: "Хууль иргэний хувьд хар хайрцаг",
    body: (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Big value="93.9%" label="тайлан цаасан (PDF/скан)" />
        <Big value="41%" label="парламентад итгэх итгэл (OECD, 2023)" />
        <Big value="0" label="иргэний санал өгсний хариу авах баталгаа" />
      </div>
    ),
  },
  {
    eyebrow: "Слайд 2 · Шийдэл",
    title: "Санал → Бүлэг → Хариу → Хэрэгжилт",
    body: (
      <ul className="space-y-2 text-[15px] leading-relaxed">
        <li><b>Иргэн</b> санал өгнө → агуулгаараа бүлэглэгдэнэ.</li>
        <li><b>Комисс</b> AI ноорог хариугаа засаад батална.</li>
        <li><b>Ажилтан</b> тайланг гарын товчлуураар шалгаж Word гаргана.</li>
      </ul>
    ),
  },
  {
    eyebrow: "Слайд 3 · Хэрэглэгчийн 5 урсгал",
    title: "Иргэнээс ажилтан хүртэл нэг цонх",
    body: (
      <ol className="list-decimal space-y-1.5 pl-6 text-[15px]">
        <li>Иргэн санал өгч бүлэгт нэгдэнэ</li>
        <li>Ажилтан тайлан шалгана</li>
        <li>Комисс AI ноорог засна</li>
        <li>Хяналтын багц зорилтыг хянана</li>
        <li>Иргэн /me дээр өөрийн оролцоог хардаг</li>
      </ol>
    ),
  },
  {
    eyebrow: "Слайд 4 · Демо",
    title: "4 минутын амьд демо",
    body: (
      <div className="grid grid-cols-1 gap-2 text-[14px] md:grid-cols-2">
        <DemoStep n={1} label="/laws/hodolmor-2026 — санал өгөх" />
        <DemoStep n={2} label="/staff/reports/rep-2026q3-hns — Y/N + Word" />
        <DemoStep n={3} label="/staff/laws/…/feedback — AI ноорог батлах" />
        <DemoStep n={4} label="/directives/dir-042 — ScoreCompare + нотолгоо" />
      </div>
    ),
  },
  {
    eyebrow: "Слайд 5 · Технологи + дүрэм + хүн",
    title: "AI ганцаараа биш — гурвуулаа",
    body: (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Layer title="AI" body="Тайлан → зорилт холбох, санал → бүлэг, ноорог хариу" />
        <Layer title="Дүрэм" body="15+ зөрүү → улаан флаг, 3 бүлэг → анхаарал татах" />
        <Layer title="Хүн" body="Гарын товчлуураар эцсийн шийдвэр" />
      </div>
    ),
  },
  {
    eyebrow: "Слайд 6 · Цаашдын алхам",
    title: "Замын зураг · 12 сар",
    body: (
      <ul className="space-y-1.5 text-[15px]">
        <li>Q4 2026 — ДАН нэвтрэлт</li>
        <li>Q1 2027 — legalinfo.mn API холболт</li>
        <li>Q2 2027 — SMS/PWA мэдэгдэл</li>
        <li>Q3 2027 — Нээлттэй тайлангийн API</li>
      </ul>
    ),
  },
];

export default function PitchPage() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter")
        setI((x) => Math.min(slides.length - 1, x + 1));
      if (e.key === "ArrowLeft") setI((x) => Math.max(0, x - 1));
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  const s = slides[i];

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-parliament-950 text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(244,197,66,0.15), transparent 50%), radial-gradient(circle at 80% 70%, rgba(58,103,212,0.35), transparent 60%)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1200px] flex-col px-8 py-12">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-400">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-gold-400 text-parliament-950">
              P
            </span>
            Parlagmatic · Пич
          </div>
          <div className="text-[11px] font-semibold text-white/70">
            ← →  слайд солих
          </div>
        </header>

        <div key={i} className="flex flex-1 flex-col justify-center animate-rise">
          <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold-400">
            {s.eyebrow}
          </div>
          <h1 className="mt-3 max-w-4xl text-4xl font-bold leading-tight md:text-5xl">
            {s.title}
          </h1>
          <div className="mt-8 max-w-4xl text-white/85">{s.body}</div>
        </div>

        <footer className="flex items-center justify-between">
          <button
            onClick={() => setI((x) => Math.max(0, x - 1))}
            className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white/85 ring-1 ring-white/20 transition hover:bg-white/20 disabled:opacity-30"
            disabled={i === 0}
            aria-label="Өмнөх"
          >
            ←
          </button>
          <div className="flex items-center gap-1.5">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setI(idx)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  idx === i ? "w-8 bg-gold-400" : "w-2 bg-white/25 hover:bg-white/40",
                )}
                aria-label={`Слайд ${idx + 1}`}
              />
            ))}
          </div>
          <button
            onClick={() => setI((x) => Math.min(slides.length - 1, x + 1))}
            className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white/85 ring-1 ring-white/20 transition hover:bg-white/20 disabled:opacity-30"
            disabled={i === slides.length - 1}
            aria-label="Дараах"
          >
            →
          </button>
        </footer>
      </div>
    </div>
  );
}

function Big({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.06] p-5 ring-1 ring-white/10">
      <div className="text-4xl font-bold text-gold-400">{value}</div>
      <div className="mt-1 text-[13px] text-white/75">{label}</div>
    </div>
  );
}

function DemoStep({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/[0.06] px-4 py-3 ring-1 ring-white/10">
      <span className="grid h-7 w-7 place-items-center rounded-full bg-gold-400 text-[12px] font-bold text-parliament-950">
        {n}
      </span>
      <span className="font-mono text-[12.5px] text-white/90">{label}</span>
    </div>
  );
}

function Layer({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.06] p-5 ring-1 ring-white/10">
      <div className="text-lg font-bold text-gold-400">{title}</div>
      <p className="mt-1 text-[13px] leading-relaxed text-white/80">{body}</p>
    </div>
  );
}
