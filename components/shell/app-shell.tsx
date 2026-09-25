import { TopBar } from "./top-bar";
import { BottomNav } from "./bottom-nav";
import { SiteFooter } from "./site-footer";
import { MeProvider } from "./me-context";
import { ToastProvider } from "@/components/ui/toast";

// Иргэний хэсгийн хүрээ: наалттай толгой, агуулга, хөл, гар утасны доод цэс.
// MeProvider нь GET /api/me-г нэг удаа татаж бүх хуудсанд хуваалцана.
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <MeProvider>
      <ToastProvider>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2"
        >
          Үндсэн агуулга руу шилжих
        </a>
        <div className="flex min-h-dvh flex-col">
          <TopBar />
          <main
            id="main"
            className="flex-1"
            style={{ paddingBottom: "calc(var(--bottom-nav-h) + env(safe-area-inset-bottom))" }}
          >
            {children}
            <SiteFooter />
          </main>
          <BottomNav />
        </div>
      </ToastProvider>
    </MeProvider>
  );
}
