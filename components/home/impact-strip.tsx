import Link from "next/link";
import { platformImpact } from "@/lib/stub/context";

const items = [
  { value: platformImpact.totalOpinions.toLocaleString("mn-MN"), label: "Иргэдийн санал" },
  { value: platformImpact.clusters.toString(), label: "Санааны бүлэг" },
  { value: platformImpact.respondedTargets, label: "Хариу өгсөн зорилт" },
  { value: platformImpact.speedMultiplier, label: "Тайлан шалгах хурд" },
];

export function ImpactStrip() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-[1400px] px-6 py-10">
        <div className="grid grid-cols-2 gap-3 rounded-2xl border border-parliament-100 bg-gradient-to-r from-parliament-50/70 via-white to-parliament-50/70 p-4 sm:grid-cols-4">
          {items.map((it) => (
            <div key={it.label} className="text-center">
              <div className="text-2xl font-bold tabular-nums text-parliament-900">
                {it.value}
              </div>
              <div className="mt-0.5 text-[11.5px] text-ink-500">{it.label}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-center text-[11.5px] text-ink-500">
          Бүх тоо стуб — жинхэнэ өгөгдөл ирэх үеийн загвар. Дэлгэрэнгүй:{" "}
          <Link
            href="/stats"
            className="ml-1 font-semibold text-parliament-800 hover:text-parliament-900"
          >
            /stats →
          </Link>
        </div>
      </div>
    </section>
  );
}
