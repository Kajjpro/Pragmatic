"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

// 0-оос бодит тоо хүртэл тоолно. Демогийн гол мөч тул хурдан (≤ 1.6 сек).
// Хөдөлгөөн багасгах тохиргоотой бол шууд эцсийн тоог харуулна.
export function CountUp({
  to,
  duration = 1600,
  className,
}: {
  to: number;
  duration?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [n, setN] = useState(0);

  useEffect(() => {
    if (reduce) return; // анимацигүй — доорх shown шууд эцсийн утгыг өгнө
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // төгсгөл рүүгээ удаашрана
      setN(Math.round(to * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration, reduce]);

  return (
    <span className={className} aria-label={String(to)}>
      {reduce ? to : n}
    </span>
  );
}
