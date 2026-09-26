import Link from "next/link";

// "Parlagmatic" лого: УИХ-ын танхимын багана (гурван багана + дээвэр) бүхий тэмдэг + нэр.
export function Logo() {
  return (
    <Link href="/" aria-label="Parlagmatic — Нүүр" className="flex items-center gap-2 rounded-md">
      <span aria-hidden className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-on-primary shadow-brand">
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor">
          <path d="M12 2.5 2.5 7.5v1.5h19V7.5L12 2.5Z" />
          <rect x="4.5" y="10.5" width="2.6" height="7.5" rx="0.6" />
          <rect x="10.7" y="10.5" width="2.6" height="7.5" rx="0.6" />
          <rect x="16.9" y="10.5" width="2.6" height="7.5" rx="0.6" />
          <rect x="2.5" y="19" width="19" height="2.5" rx="0.8" />
        </svg>
      </span>
      <span className="text-[19px] font-extrabold tracking-tight text-heading">
        Parla<span className="text-primary">gmatic</span>
      </span>
    </Link>
  );
}
