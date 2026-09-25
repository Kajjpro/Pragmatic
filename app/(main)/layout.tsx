import { AppShell } from "@/components/shell/app-shell";

// Иргэний хэсгийн хүрээ (/, /feed, /predict, /me, /bills/[id]).
// /staff энд ороогүй — тэр өөрийн layout-тай.
export default function MainLayout({ children }: LayoutProps<"/">) {
  return <AppShell>{children}</AppShell>;
}
