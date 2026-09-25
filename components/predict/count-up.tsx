"use client";

import { useEffect, useState } from "react";

// 0-оос бодит тоо хүртэл тоолно (≤ 1.5 сек), дараа нь хөдөлгөөнгүй.
// Хөдөлгөөн багасгах тохиргоотой бол шууд эцсийн тоог харуулна.
export function CountUp({ to, durationMs = 1400 }: { to: number; durationMs?: number }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || to === 0) {
      setValue(to);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      setValue(Math.round(to * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [to, durationMs]);

  return <span className="tabular-nums">{value.toLocaleString("mn-MN")}</span>;
}
