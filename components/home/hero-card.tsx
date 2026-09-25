"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { cn } from "@/lib/cn";

const slides = [
  {
    kicker: "УИХ · ХЭВЛЭЛИЙН МЭДЭЭ",
    date: "2026 оны 9 сарын 25, Баасан",
    title:
      "Цөлжилттэй тэмцэх НҮБ-ын конвенцын хөтөлбөрийг үндэсний үйл хэрэг болгох улс төрийн манлайлал",
    lead:
      "«Цөлжилт, газрын доройтол, ган гачигтай тэмцэх парламентын манлайлал» олон улсын форумд Монгол Улс тэргүүлэн оролцов.",
    byline: "Хэвлэлийн албанаас",
    read: "4 минут",
    stat: { value: "196", label: "улс оролцов" },
  },
  {
    kicker: "УИХ-ЫН ДАРГА · МЭДЭЭ",
    date: "2026 оны 9 сарын 24, Пүрэв",
    title:
      "УИХ-ын дарга Азийн парламентын чуулганы үеэр хоёр талын уулзалт хийлээ",
    lead:
      "Бүс нутгийн парламентын хамтын ажиллагааг өргөжүүлэх санамж бичигт гарын үсэг зурав.",
    byline: "Гадаад харилцааны хэлтэс",
    read: "3 минут",
    stat: { value: "12", label: "хоёр талын уулзалт" },
  },
  {
    kicker: "БАЙНГЫН ХОРОО · ХЭЛЭЛЦҮҮЛЭГ",
    date: "2026 оны 9 сарын 23, Лхагва",
    title:
      "«Хөдөлмөрийн тухай хууль»-ийн шинэчилсэн найруулга парламентад хэлэлцэгдэнэ",
    lead:
      "24,500 иргэний саналыг AI кластераар ангилж, Нийгмийн бодлогын байнгын хороонд хүргүүлэв.",
    byline: "Хууль тогтоомжийн газар",
    read: "6 минут",
    stat: { value: "24,500", label: "иргэний санал" },
  },
];

export function HeroCard() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const kickerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const leadRef = useRef<HTMLParagraphElement>(null);
  const bylineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setActive((a) => (a + 1) % slides.length);
    }, 8000);
    return () => clearInterval(id);
  }, [paused]);

  useEffect(() => {
    const targets = [
      kickerRef.current,
      titleRef.current,
      leadRef.current,
      bylineRef.current,
    ].filter(Boolean);
    if (!targets.length) return;

    const tl = gsap.timeline();
    tl.fromTo(
      targets,
      { y: 14, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.9,
        stagger: 0.12,
        ease: "power2.out",
      },
    );
    return () => {
      tl.kill();
    };
  }, [active]);

  const slide = slides[active];

  return (
    <article
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="group relative overflow-hidden rounded-2xl bg-parliament-950 shadow-[0_30px_80px_-40px_rgba(15,42,99,0.65)] ring-1 ring-white/[0.05] animate-rise"
    >
      <div className="relative aspect-[16/9] w-full">
        {/* deep base — nearly flat, just a hint of dimension */}
        <div
          className="absolute inset-0 bg-[linear-gradient(180deg,#050e26_0%,#0a1a3d_60%,#08152f_100%)]"
          aria-hidden
        />

        {/* single warm ambient glow (not aurora) */}
        <div className="warm-glow" aria-hidden />

        {/* film grain */}
        <div className="grain" aria-hidden />

        {/* editorial rule at the very top */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent" />

        {/* small masthead emblem — top-left */}
        <div className="pointer-events-none absolute left-8 top-8 flex items-center gap-2.5">
          <Image
            src="/Их_хурал_logo.png"
            alt=""
            width={72}
            height={72}
            className="h-10 w-10 object-contain opacity-90"
          />
          <div className="hidden sm:block">
            <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/50">
              Монгол Улсын
            </div>
            <div className="text-[10.5px] font-bold uppercase tracking-[0.24em] text-white/85">
              Их Хурал
            </div>
          </div>
        </div>

        {/* reader stat — tiny, not a splashy pill */}
        <div className="absolute right-8 top-8 flex items-center gap-3 text-[10.5px] font-medium uppercase tracking-[0.16em] text-white/50">
          <span className="tabular-nums text-white/75">
            {slide.stat.value}
          </span>
          <span>{slide.stat.label}</span>
        </div>

        {/* content — editorial column */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-5 px-8 pb-9 pt-24 text-white">
          <div
            ref={kickerRef}
            className="flex items-center gap-3 text-[10.5px] font-semibold uppercase tracking-[0.24em] text-gold-400"
          >
            <span className="h-px w-6 bg-gold-400" />
            <span>{slide.kicker}</span>
            <span className="text-white/40">·</span>
            <span className="text-white/60">{slide.date}</span>
          </div>

          <h2
            ref={titleRef}
            className="font-editorial max-w-3xl text-[26px] font-medium leading-[1.15] text-white sm:text-[30px] md:text-[34px]"
          >
            {slide.title}
          </h2>

          <p
            ref={leadRef}
            className="max-w-2xl text-[13.5px] leading-relaxed text-white/75"
          >
            {slide.lead}
          </p>

          <div
            ref={bylineRef}
            className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-white/50"
          >
            <span className="uppercase tracking-[0.14em]">{slide.byline}</span>
            <span className="h-3 w-px bg-white/20" />
            <span>{slide.read} унших</span>
            <span className="h-3 w-px bg-white/20" />
            <button className="font-semibold text-white/85 transition hover:text-white">
              Дэлгэрэнгүй →
            </button>
          </div>
        </div>

        {/* nav arrows — quieter */}
        <div className="absolute inset-y-0 left-3 flex items-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <button
            aria-label="Өмнөх"
            onClick={() =>
              setActive((a) => (a - 1 + slides.length) % slides.length)
            }
            className="grid h-9 w-9 place-items-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
              <path
                d="m12 5-5 5 5 5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        <div className="absolute inset-y-0 right-3 flex items-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <button
            aria-label="Дараах"
            onClick={() => setActive((a) => (a + 1) % slides.length)}
            className="grid h-9 w-9 place-items-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
              <path
                d="m8 5 5 5-5 5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* footer nav — thin rule + dots */}
      <div className="relative flex items-center justify-between bg-parliament-950 px-8 py-3">
        <div className="absolute inset-x-8 top-0 h-px bg-white/[0.06]" />
        <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.16em] text-white/45">
          <span className="tabular-nums text-white/75">
            {(active + 1).toString().padStart(2, "0")}
          </span>
          <span>/</span>
          <span className="tabular-nums">
            {slides.length.toString().padStart(2, "0")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              aria-label={`Слайд ${i + 1}`}
              onClick={() => setActive(i)}
              className={cn(
                "h-1 rounded-full transition-all duration-500 ease-out",
                i === active
                  ? "w-10 bg-gold-400/80"
                  : "w-4 bg-white/15 hover:bg-white/30",
              )}
            />
          ))}
        </div>
      </div>
    </article>
  );
}
