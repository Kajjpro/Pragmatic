import { registryItems } from "@/lib/stub/registry";
import { RegistryBoard } from "@/components/staff/registry-board";

export default function RegistryPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-parliament-900">
          Хяналтын бүртгэл
        </h1>
        <p className="mt-1 text-[13px] text-ink-500">
          Ямар зорилтуудыг УИХ Тамгын газраас байнга хянах, аль нь дуусаж
          хяналтаас гарах вэ — эх ишлэлтэй нь харна.
        </p>
      </div>
      <RegistryBoard items={registryItems} />
    </div>
  );
}
