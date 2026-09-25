// Доод цэсний 4 зүйл. Бүх линк бодит хуудас руу заана (үхмэл товч байхгүй).
export const navItems = [
  { href: "/", label: "Нүүр", icon: "home" },
  { href: "/feed", label: "Хууль", icon: "cards" },
  { href: "/predict", label: "Таамаг", icon: "target" },
  { href: "/me", label: "Би", icon: "user" },
] as const;

export type NavIcon = (typeof navItems)[number]["icon"];
