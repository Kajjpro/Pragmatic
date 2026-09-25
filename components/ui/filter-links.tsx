import Link from "next/link";
import { cn } from "@/lib/cn";

// Шүүлтүүрийн сонголтууд — энгийн холбоос (JavaScript-гүй ч ажиллана, хаягаар хуваалцана)
export function FilterLinks({
  label,
  options,
}: {
  label: string;
  options: { href: string; text: string; active: boolean }[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[14px] text-muted">{label}:</span>
      {options.map((o) => (
        <Link
          key={o.href}
          href={o.href}
          aria-current={o.active ? "true" : undefined}
          className={cn(
            "rounded-md border px-3 py-1.5 text-[14px] font-medium",
            o.active ? "border-primary bg-primary text-on-primary" : "border-line bg-surface text-fg hover:border-primary",
          )}
        >
          {o.text}
        </Link>
      ))}
    </div>
  );
}
