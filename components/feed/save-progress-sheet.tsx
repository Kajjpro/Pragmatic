"use client";

import { SignInButton } from "@clerk/nextjs";
import { Sheet } from "@/components/ui/sheet";
import { StreakFlame } from "@/components/ui/streak-flame";

// Эхний викторыг дуусгасны дараа зөөлөн санал болгоно.
// Уншихыг ХЭЗЭЭ Ч хаахгүй — зүгээр л хаагаад үргэлжлүүлж болно.
export function SaveProgressSheet({
  open,
  onClose,
  points,
  streak,
}: {
  open: boolean;
  onClose: () => void;
  points: number;
  streak: number;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Оноогоо хадгалах уу?">
      <p className="text-[15.5px] leading-relaxed text-ink-600">
        Нэвтрэхгүй бол оноо, streak чинь зөвхөн энэ төхөөрөмж дээр үлдэнэ.
      </p>

      <div className="mt-4 flex items-center justify-center gap-3 rounded-2xl bg-ink-50 p-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-point-100 px-3 py-1.5 text-[15px] font-extrabold tabular-nums text-point-700">
          {points.toLocaleString("mn-MN")} оноо
        </span>
        <StreakFlame days={streak} />
      </div>

      <div className="mt-5 flex flex-col gap-2.5">
        <SignInButton mode="modal">
          <button className="press min-h-14 w-full rounded-2xl bg-brand-600 text-[16px] font-extrabold text-white shadow-brand hover:bg-brand-700">
            Google-ээр нэвтрэх
          </button>
        </SignInButton>
        <button
          type="button"
          onClick={onClose}
          className="press min-h-12 w-full rounded-2xl bg-ink-100 text-[15px] font-bold text-ink-700 hover:bg-ink-200"
        >
          Дараа — үргэлжлүүлэх
        </button>
      </div>
    </Sheet>
  );
}
