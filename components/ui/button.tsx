import { cn } from "@/lib/cn";

// Товчны загварууд. Линк дээр ч ашиглахын тулд buttonClass-ыг тусад нь гаргав.
// Дэлгэц бүрт нэг л "primary" товч байна; бусад нь "secondary" эсвэл "ghost".
type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-on-primary shadow-brand hover:bg-primary-hover active:scale-[0.98]",
  secondary: "border border-line-strong bg-surface text-fg hover:border-primary hover:bg-action-bg hover:text-action active:scale-[0.98]",
  ghost: "text-action hover:bg-action-bg",
  danger: "bg-bad-fg text-white hover:opacity-90",
};

const sizes: Record<Size, string> = {
  sm: "min-h-9 px-3.5 text-[14px]",
  md: "min-h-11 px-5 text-[15px]",
  lg: "min-h-12 px-6 text-[16px]",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl font-semibold transition-[background-color,border-color,color,transform] duration-150 motion-reduce:transform-none",
    "disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />;
}
