import { CalendarCheck, Landmark, Vote } from "lucide-react";
import type { BadgeType } from "@/lib/types";

// Тэмдгийн дүрс (emoji биш). "Хууль өөрчилсөн иргэн" нь бүдэг алтаар.
export function BadgeIcon({ type, className = "h-5 w-5" }: { type: BadgeType; className?: string }) {
  if (type === "LAW_CHANGER") return <Landmark aria-hidden className={`${className} text-gold`} strokeWidth={1.75} />;
  if (type === "STREAK_7") return <CalendarCheck aria-hidden className={`${className} text-heading`} strokeWidth={1.75} />;
  return <Vote aria-hidden className={`${className} text-heading`} strokeWidth={1.75} />;
}
