// Гарын товчлуурын заавар (ажилтны хэсэгт: ↑ ↓ A)
export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-[22px] items-center justify-center rounded border border-line-strong bg-surface px-1.5 py-0.5 font-sans text-[12px] font-medium text-muted">
      {children}
    </kbd>
  );
}
