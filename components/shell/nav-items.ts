import { Home, BookOpenText, Scale, Vote, BadgeCheck, type LucideIcon } from "lucide-react";

// Үндсэн цэс: гурван гол боломж (①②⑥) төвд. Гар утсанд short нэрийг доод цэсэнд харуулна.
export type NavItem = { href: string; label: string; short: string; icon: LucideIcon; hero?: boolean };

export const navItems: NavItem[] = [
  { href: "/", label: "Нүүр", short: "Нүүр", icon: Home },
  { href: "/feed", label: "Өнөөдрийн хууль", short: "Өнөөдөр", icon: BookOpenText, hero: true },
  { href: "/predict", label: "Таамаг", short: "Таамаг", icon: Vote, hero: true },
  { href: "/me", label: "Би хууль өөрчилсөн", short: "Нөлөө", icon: BadgeCheck, hero: true },
  { href: "/bills", label: "Хуулийн төслүүд", short: "Төслүүд", icon: Scale },
];

// "/" зөвхөн яг таарвал идэвхтэй; бусад нь дэд хуудсыг хамруулна
export function isActive(href: string, path: string) {
  return href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`);
}
