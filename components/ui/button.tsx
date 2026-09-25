import { cn } from "@/lib/cn";

// Товчны загварууд. Линк дээр ч ашиглахын тулд buttonClass-ыг тусад нь гаргав.
type Variant = "primary" | "point" | "outline" | "ghost" | "ok" | "bad";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  // Гол үйлдэл — цор ганц өргөлт өнгө
  primary: "bg-brand-600 text-white shadow-brand hover:bg-brand-700",
  // Зөвхөн оноотой холбоотой үйлдэлд
  point: "bg-point-400 text-ink-950 shadow-point hover:bg-point-500",
  outline:
    "border-2 border-ink-200 bg-white text-ink-900 hover:border-brand-400 hover:text-brand-700",
  ghost: "text-ink-700 hover:bg-ink-100 hover:text-ink-900",
  ok: "bg-ok-700 text-white hover:bg-ok-800",
  bad: "bg-bad-600 text-white hover:bg-bad-800",
};

const sizes: Record<Size, string> = {
  sm: "min-h-10 px-4 text-[14px]",
  md: "min-h-12 px-5 text-[15px]",
  lg: "min-h-14 px-7 text-[17px]",
};

export function buttonClass(
  variant: Variant = "primary",
  size: Size = "md",
  className?: string,
) {
  return cn(
    "press inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl font-bold",
    "disabled:pointer-events-none disabled:opacity-55",
    variants[variant],
    sizes[size],
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}
