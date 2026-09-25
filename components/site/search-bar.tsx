"use client";

export function SearchBar({
  value,
  onChange,
}: {
  value?: string;
  onChange?: (v: string) => void;
}) {
  return (
    <div className="relative bg-parliament-950 pb-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.06),transparent_60%)]" />
      <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-6">
        <button
          type="button"
          className="group inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/[0.04] px-4 py-2 text-[12.5px] font-medium text-white/85 transition hover:border-white/60 hover:bg-white/[0.08] hover:text-white"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
          </span>
          <span>Онлайн хуралдаан үзэх</span>
        </button>

        <form
          onSubmit={(e) => e.preventDefault()}
          className="group relative flex-1"
          role="search"
        >
          <span className="pointer-events-none absolute inset-y-0 left-5 flex items-center text-parliament-500">
            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
              <circle
                cx="9"
                cy="9"
                r="6"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <path
                d="m14 14 3.2 3.2"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <input
            type="search"
            value={value ?? ""}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder="Хууль, зорилт, байгууллагын нэрээр хайх…"
            className="h-11 w-full rounded-full border border-white/10 bg-white pl-12 pr-14 text-sm text-ink-900 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.45)] outline-none transition placeholder:text-ink-500 focus:border-parliament-500 focus:shadow-[0_10px_35px_-10px_rgba(58,103,212,0.55)]"
          />
          <button
            type="submit"
            aria-label="Хайх"
            className="absolute inset-y-1.5 right-1.5 inline-flex items-center justify-center rounded-full bg-parliament-800 px-4 text-white transition hover:bg-parliament-700"
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
              <circle
                cx="9"
                cy="9"
                r="6"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="m14 14 3.2 3.2"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
