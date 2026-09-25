import { cn } from "@/lib/cn";

// Үндсэн хүрээ: цагаан гадаргуу, нимгэн хүрээ, маш бүдэг сүүдэр.
export function Card({
  children,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "aside";
}) {
  return <Tag className={cn("rounded-lg border border-line bg-surface shadow-card", className)}>{children}</Tag>;
}
