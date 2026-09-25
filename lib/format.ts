// Огноог монголоор, сервер ба хөтөч дээр ИЖИЛ харуулна.
// (Хөтөч бүр монгол хэлний Intl өгөгдөлтэй байдаггүй тул гараар бичив.)
// Улаанбаатарын цаг = UTC+8 (зуны цаг хэрэглэдэггүй).
const OFFSET_MS = 8 * 60 * 60 * 1000;

function ulaanbaatar(value: string | Date): Date {
  return new Date(new Date(value).getTime() + OFFSET_MS);
}

const pad = (n: number) => String(n).padStart(2, "0");

// "2026-09-25T..." → "2026 оны 9-р сарын 25"
export function formatDate(value: string | Date): string {
  const d = ulaanbaatar(value);
  return `${d.getUTCFullYear()} оны ${d.getUTCMonth() + 1}-р сарын ${d.getUTCDate()}`;
}

// "2026-09-25T..." → "2026.09.25"
export function formatShortDate(value: string | Date): string {
  const d = ulaanbaatar(value);
  return `${d.getUTCFullYear()}.${pad(d.getUTCMonth() + 1)}.${pad(d.getUTCDate())}`;
}

// "2026-09-25T10:05:00Z" → "18:05"
export function formatTime(value: string | Date): string {
  const d = ulaanbaatar(value);
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}
