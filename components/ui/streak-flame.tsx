"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";

// Тасралтгүй өдрийн тоо + дөл. Тоо 0 бол дөл унтарсан (саарал) харагдана.
export function StreakFlame({
  days,
  size = "md",
  className,
}: {
  days: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const reduce = useReducedMotion();
  const alive = days > 0;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-extrabold tabular-nums",
        size === "sm" ? "px-2.5 py-1 text-[13px]" : "px-3 py-1.5 text-[15px]",
        alive ? "bg-point-100 text-point-700" : "bg-ink-100 text-ink-600",
        className,
      )}
      aria-label={`${days} хоног тасралтгүй`}
    >
      <motion.span
        aria-hidden
        // Дөл нь маш бага хэмжээгээр "амьсгална"
        animate={
          alive && !reduce ? { scale: [1, 1.14, 1] } : { scale: 1 }
        }
        transition={{ duration: 1.8, repeat: alive && !reduce ? Infinity : 0, ease: "easeInOut" }}
        className={size === "sm" ? "text-[14px]" : "text-[16px]"}
      >
        {alive ? "🔥" : "🕯️"}
      </motion.span>
      {days}
    </span>
  );
}
