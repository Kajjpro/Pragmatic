import { Home, BookOpenText, Scale, Vote, UserRound, type LucideIcon } from "lucide-react";

// Үндсэн цэс. Гар утсанд short нэрийг доод цэсэнд харуулна.
export type NavItem = { href: string; label: string; short: string; icon: LucideIcon };

export const navItems: NavItem[] = [
  { href: "/", label: "Нүүр", short: "Нүүр", icon: Home },
  { href: "/feed", label: "Өнөөдрийн хууль", short: "Өнөөдөр", icon: BookOpenText },
  { href: "/bills", label: "Хуулийн өөрчлөлт", short: "Өөрчлөлт", icon: Scale },
  { href: "/predict", label: "Таамаг", short: "Таамаг", icon: Vote },
  { href: "/me", label: "Миний оролцоо", short: "Оролцоо", icon: UserRound },
];

// "/" зөвхөн яг таарвал идэвхтэй; бусад нь дэд хуудсыг хамруулна
export function isActive(href: string, path: string) {
  return href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`);
}
