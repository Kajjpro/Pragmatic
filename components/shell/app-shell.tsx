import { TopBar } from "./top-bar";
import { BottomNav } from "./bottom-nav";
import { ToastProvider } from "@/components/ui/toast";

// Иргэний хэсгийн ерөнхий хүрээ: дээд самбар + доод цэс (гар утсанд).
// /staff энэ хүрээг ашиглахгүй — тэнд өөрийн layout бий.
export function AppShell({
  children,
  points,
  streak,
}: {
  children: React.ReactNode;
  points?: number;
  streak?: number;
}) {
  return (
    <ToastProvider>
      <div className="flex min-h-dvh flex-col">
        <TopBar points={points} streak={streak} />
        {/* Доод цэс агуулгыг хаахгүйн тулд зай үлдээв */}
        <main
          className="flex-1"
          style={{ paddingBottom: "calc(var(--bottom-nav-h) + env(safe-area-inset-bottom))" }}
        >
          {children}
        </main>
        <BottomNav />
      </div>
    </ToastProvider>
  );
}
