import { TopBar } from "./top-bar";
import { BottomNav } from "./bottom-nav";
import { MeProvider } from "./me-context";
import { ToastProvider } from "@/components/ui/toast";

// Иргэний хэсгийн ерөнхий хүрээ: дээд самбар + доод цэс (гар утсанд).
// MeProvider нь GET /api/me-г нэг удаа татаж бүх хуудсанд хуваалцана.
// /staff энэ хүрээг ашиглахгүй — тэнд өөрийн layout бий.
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <MeProvider>
      <ToastProvider>
        <div className="flex min-h-dvh flex-col">
          <TopBar />
          <main
            className="flex-1"
            style={{ paddingBottom: "calc(var(--bottom-nav-h) + env(safe-area-inset-bottom))" }}
          >
            {children}
          </main>
          <BottomNav />
        </div>
      </ToastProvider>
    </MeProvider>
  );
}
