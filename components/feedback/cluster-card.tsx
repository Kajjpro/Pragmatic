import type { EvidenceCluster } from "@/lib/stub/types";

export function ClusterCard({ cluster }: { cluster: EvidenceCluster }) {
  return (
    <div className="rounded-xl border border-ink-100 bg-parliament-50/40 p-3">
      <div className="flex items-center gap-2 text-[11px] text-ink-500">
        <span className="rounded-full bg-white px-2 py-0.5 font-semibold text-parliament-800 ring-1 ring-parliament-100">
          {cluster.count.toLocaleString("mn-MN")} нотолгоо
        </span>
      </div>
      <h4 className="mt-2 text-[13px] font-semibold text-ink-900">
        {cluster.label}
      </h4>
      <p className="mt-1 text-[12px] leading-relaxed text-ink-500">
        {cluster.summary}
      </p>
      {cluster.response ? (
        <div className="mt-2 rounded-lg bg-white p-2.5 text-[12px] text-parliament-800 ring-1 ring-parliament-100">
          <span className="mr-1 text-[10px] font-semibold uppercase tracking-wider text-parliament-500">
            Байгууллагын хариу
          </span>
          {cluster.response}
        </div>
      ) : null}
    </div>
  );
}
