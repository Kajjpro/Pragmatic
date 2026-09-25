// Эх сурвалжийн холболтын төлөв (толгойн "УИХ API" шошго).
// Бодит дуудлагаар шалгана — "Холбогдсон" гэж зөвхөн амжилттай хариу ирсэн үед л бичнэ.
// 5 минут кэшлэнэ: хуудас бүр ParliamentAPI-г дуудахгүй.
import { unstable_cache } from "next/cache";
import { getAgendaList } from "@/lib/parliament";

export type SourceState = "online" | "offline" | "unconfigured";

export type SourceStatus = {
  parliament: SourceState;
  checkedAt: string;
};

async function checkParliament(): Promise<SourceStatus> {
  const checkedAt = new Date().toISOString();
  if (!process.env.PARLIAMENT_API_URL) return { parliament: "unconfigured", checkedAt };
  try {
    await getAgendaList();
    return { parliament: "online", checkedAt };
  } catch {
    return { parliament: "offline", checkedAt };
  }
}

export const getSourceStatus = unstable_cache(checkParliament, ["source-status"], { revalidate: 300 });
