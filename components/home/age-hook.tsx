"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

// Нүүр хуудасны дэгээ: нэг асуулт → хариулт сонгоход бидний түүх нээгдэнэ.
// Шүүгч эхний 10 секундэд юу хийж байгаагаа ойлгох ёстой.
const answers = [
  "14-өөс өмнө",
  "14–17 насандаа",
  "18-аас хойш",
  "Одоо л мэдлээ",
];

export function AgeHook() {
  const [picked, setPicked] = useState<string | null>(null);
  const reduce = useReducedMotion();

  // Хөдөлгөөн багасгах тохиргоотой бол зөвхөн бүдгэрнэ
  const rise = (delay: number) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduce ? 0.2 : 0.5, delay: reduce ? 0 : delay, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <div className="flex flex-col">
      <AnimatePresence mode="wait">
        {picked === null ? (
          <motion.div
            key="question"
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <motion.p
              {...rise(0)}
              className="text-[13px] font-extrabold uppercase tracking-[0.18em] text-brand-300"
            >
              Нэг асуулт
            </motion.p>

            <motion.h1
              {...rise(0.06)}
              className="mt-3 max-w-[15ch] text-[34px] font-extrabold leading-[1.08] tracking-tight text-white sm:text-[52px] lg:text-[60px]"
            >
              Та УИХ-ыг хэдэн настайдаа анх мэдсэн бэ?
            </motion.h1>

            {/* Хариултууд — дарахад түүх нээгдэнэ */}
            <motion.div
              {...rise(0.14)}
              className="mt-7 grid grid-cols-1 gap-2.5 sm:max-w-md sm:grid-cols-2"
            >
              {answers.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setPicked(a)}
                  className="press min-h-14 rounded-2xl border-2 border-white/25 bg-white/10 px-5 text-left text-[16px] font-bold text-white backdrop-blur-sm hover:border-white/60 hover:bg-white/20"
                >
                  {a}
                </button>
              ))}
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="story"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0.2 : 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-[13px] font-extrabold uppercase tracking-[0.18em] text-brand-300">
              Таны хариулт: {picked}
            </p>

            {/* Бидний үнэн түүх */}
            <h1 className="mt-3 max-w-[18ch] text-[30px] font-extrabold leading-[1.1] tracking-tight text-white sm:text-[44px] lg:text-[52px]">
              Бид 17 настай.
            </h1>
            <p className="mt-4 max-w-lg text-[17px] leading-relaxed text-white/85 sm:text-[19px]">
              Хакатонд бүртгүүлэх хүртлээ УИХ-д иргэдийн платформ байдгийг
              мэдээгүй.
            </p>

            {/* Уриа */}
            <motion.p
              {...rise(0.18)}
              className="mt-7 text-[24px] font-extrabold leading-tight tracking-tight text-white sm:text-[32px]"
            >
              Хууль 60 секундэд.{" "}
              <span className="text-brand-300">Таамагла.</span>{" "}
              <span className="text-point-400">Өөрчил.</span>
            </motion.p>

            <motion.div {...rise(0.26)} className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/feed"
                className="press inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-point-400 px-7 text-[17px] font-extrabold text-ink-950 shadow-point hover:bg-point-500"
              >
                60 секундэд нэг хууль →
              </Link>
              <button
                type="button"
                onClick={() => setPicked(null)}
                className="press min-h-14 rounded-2xl px-4 text-[15px] font-bold text-white/70 hover:text-white"
              >
                Асуултыг дахин харах
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
