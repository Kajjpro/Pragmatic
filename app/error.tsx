"use client";

import Link from "next/link";
import { Logo } from "@/components/shell/logo";
import { Button, buttonClass } from "@/components/ui/button";

// Хуудас ачаалахад гэнэтийн алдаа гарвал энд харагдана
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-dvh bg-page">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-[1120px] items-center px-4 sm:px-6">
          <Logo />
        </div>
      </header>
      <main className="mx-auto max-w-[1120px] px-4 py-20 sm:px-6">
        <h1 className="text-[30px] font-bold">Уучлаарай, алдаа гарлаа</h1>
        <p className="mt-3 max-w-xl text-muted">
          Хуудсыг ачаалах үед техникийн алдаа гарлаа. Түр хүлээгээд дахин оролдоно уу.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={reset}>Дахин оролдох</Button>
          <Link href="/" className={buttonClass("secondary")}>
            Нүүр хуудас
          </Link>
        </div>
      </main>
    </div>
  );
}
