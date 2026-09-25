import { cn } from "@/lib/cn";

// Үндсэн карт. interactive={true} бол хулгана ойртуулахад бага зэрэг дээшилнэ.
export function Card({
  children,
  className,
  interactive,
}: {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-ink-200 bg-white shadow-card",
        interactive && "card-lift hover:border-brand-300 hover:shadow-lift",
        className,
      )}
    >
      {children}
    </div>
  );
}
