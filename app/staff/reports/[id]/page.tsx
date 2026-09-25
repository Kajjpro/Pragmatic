import Link from "next/link";
import { notFound } from "next/navigation";
import { getReport } from "@/lib/stub/reports";
import { ReportReview } from "@/components/monitoring/report-review";

export default async function ReportDetailPage({
  params,
}: PageProps<"/staff/reports/[id]">) {
  const { id } = await params;
  const report = getReport(id);
  if (!report) notFound();

  return (
    <div className="flex flex-col gap-5">
      <nav className="flex items-center gap-2 text-[12px] text-ink-500">
        <Link href="/staff" className="hover:text-parliament-800">
          Ажилтны булан
        </Link>
        <span>/</span>
        <Link href="/staff/reports" className="hover:text-parliament-800">
          Тайлан шалгагч
        </Link>
        <span>/</span>
        <span className="text-parliament-900">{report.id}</span>
      </nav>

      <ReportReview report={report} />
    </div>
  );
}
