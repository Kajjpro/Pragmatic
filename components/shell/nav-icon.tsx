import type { NavIcon } from "./nav-items";

// Доод цэсний энгийн дүрсүүд. Идэвхтэй үед дүүргэж харуулна.
export function Icon({ name, active }: { name: NavIcon; active: boolean }) {
  const stroke = 2;
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: stroke,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
      {name === "home" && (
        <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" {...common} fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.16 : 0} />
      )}
      {name === "cards" && (
        <>
          <rect x="3" y="6" width="13" height="15" rx="2.5" {...common} fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.16 : 0} />
          <path d="M8 3h9a3 3 0 0 1 3 3v11" {...common} />
        </>
      )}
      {name === "target" && (
        <>
          <circle cx="12" cy="12" r="8.5" {...common} />
          <circle cx="12" cy="12" r="4" {...common} fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.22 : 0} />
          <circle cx="12" cy="12" r="0.8" fill="currentColor" stroke="none" />
        </>
      )}
      {name === "user" && (
        <>
          <circle cx="12" cy="8.5" r="3.6" {...common} fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.16 : 0} />
          <path d="M4.5 20c1.4-3.8 4.2-5.6 7.5-5.6s6.1 1.8 7.5 5.6" {...common} />
        </>
      )}
    </svg>
  );
}
