"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Volume2 } from "lucide-react";
import { cn } from "@/lib/cn";

// Картыг "уншиж өгөх".
// Төхөөрөмж монгол дуу хоолойтой бол (speechSynthesis, mn) чангаар уншина.
// Үгүй бол хэсэг бүрийг уншигдах хурдаар ээлжлэн тодруулж (дагаж унших горим) харуулна —
// дуугүйг нууж "уншиж байна" гэж хуурахгүй.
const CHARS_PER_SECOND = 14; // монгол текстийн дундаж уншлагын хурд
const MIN_STEP_MS = 2500;

type Mode = "idle" | "voice" | "follow";

export function ReadAloud({
  segments,
  onStep,
  className,
}: {
  segments: string[]; // хэсэг бүрийн текст (дарааллаар)
  onStep: (index: number | null) => void; // одоо уншиж буй хэсэг
  className?: string;
}) {
  const [mode, setMode] = useState<Mode>("idle");
  const [elapsed, setElapsed] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const ticker = useRef<ReturnType<typeof setInterval> | null>(null);

  const durations = segments.map((s) => Math.max(MIN_STEP_MS, (s.length / CHARS_PER_SECOND) * 1000));
  const total = durations.reduce((a, b) => a + b, 0);

  function clear() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (ticker.current) clearInterval(ticker.current);
    ticker.current = null;
    try {
      window.speechSynthesis?.cancel();
    } catch {
      // дуу хоолойгүй төхөөрөмж
    }
  }

  function stop() {
    clear();
    setMode("idle");
    setElapsed(0);
    onStep(null);
  }

  // Карт солигдоход (unmount) заавал зогсооно
  useEffect(() => () => clear(), []);

  function mongolianVoice(): SpeechSynthesisVoice | null {
    try {
      return window.speechSynthesis?.getVoices().find((v) => v.lang.toLowerCase().startsWith("mn")) ?? null;
    } catch {
      return null;
    }
  }

  function start() {
    clear();
    const voice = mongolianVoice();
    const started = Date.now();
    ticker.current = setInterval(() => setElapsed(Date.now() - started), 200);

    if (voice) {
      setMode("voice");
      segments.forEach((text, i) => {
        const u = new SpeechSynthesisUtterance(text);
        u.voice = voice;
        u.lang = voice.lang;
        u.onstart = () => onStep(i);
        if (i === segments.length - 1) u.onend = () => stop();
        window.speechSynthesis.speak(u);
      });
      return;
    }

    setMode("follow");
    let at = 0;
    segments.forEach((_, i) => {
      timers.current.push(setTimeout(() => onStep(i), at));
      at += durations[i];
    });
    timers.current.push(setTimeout(() => stop(), at));
  }

  const playing = mode !== "idle";
  const seconds = Math.round((playing ? Math.min(elapsed, total) : total) / 1000);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <button
        type="button"
        onClick={playing ? stop : start}
        aria-pressed={playing}
        className={cn(
          "inline-flex min-h-9 items-center gap-2 rounded-full border px-3 text-[13.5px] font-semibold transition-colors",
          playing ? "border-primary bg-primary text-on-primary" : "border-line-strong bg-surface text-fg hover:border-primary",
        )}
      >
        {playing ? <Pause aria-hidden className="h-4 w-4" /> : <Volume2 aria-hidden className="h-4 w-4" />}
        {playing ? "Зогсоох" : "Уншиж өгөх"}
        <span className="tabular-nums font-medium opacity-80">
          0:{String(seconds).padStart(2, "0")}
        </span>
      </button>
      {mode === "follow" ? (
        <span className="hidden text-[12.5px] text-muted sm:inline" role="status">
          Монгол дуу хоолой энэ төхөөрөмжид алга — хэсэг бүрийг дагуулж тодруулж байна
        </span>
      ) : null}
    </div>
  );
}
