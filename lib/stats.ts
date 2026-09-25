// Нүүр хуудасны "бодит тоо". Зөвхөн бодит эх сурвалжаас; авч чадахгүй бол null (хуудсан дээр нуугдана).
// 10 минут тутам шинэчилнэ. Эх сурвалж түр унавал сүүлийн амжилттай утгыг хадгална.
import { unstable_cache } from "next/cache";
import { getAllProjects } from "@/lib/lawforum";
import { prisma } from "@/lib/prisma";

export type LiveStats = {
  activeProjects: number | null; // LawForum дээр идэвхтэй төсөл
  citizenComments: number | null; // Хариу-д иргэдийн өгсөн санал
  lastVoteDate: string | null; // УИХ-ын хамгийн сүүлийн санал хураалтын дүн (манай sync)
  updatedAt: string;
};

const REVALIDATE_SECONDS = 600;

// Сүүлийн амжилттай утгууд (серверийн санах ойд)
const lastGood: Partial<Record<"activeProjects" | "citizenComments" | "lastVoteDate", number | string>> = {};

async function countActiveProjects(): Promise<number> {
  const projects = await getAllProjects();
  return projects.filter((p) => p.isActive).length;
}

async function countCitizenComments(): Promise<number> {
  return prisma.comment.count();
}

async function findLastVoteDate(): Promise<string | null> {
  const last = await prisma.voteEvent.findFirst({
    where: { status: "REVEALED", revealedAt: { not: null } },
    orderBy: { revealedAt: "desc" },
    select: { revealedAt: true },
  });
  return last?.revealedAt?.toISOString() ?? null;
}

// Нэг эх сурвалжийг кэштэй дуудна. Алдаа гарвал кэшлэхгүй (throw), доор сүүлийн сайн утгыг өгнө.
const cachedActiveProjects = unstable_cache(countActiveProjects, ["stats-active-projects"], { revalidate: REVALIDATE_SECONDS });
const cachedCitizenComments = unstable_cache(countCitizenComments, ["stats-citizen-comments"], { revalidate: REVALIDATE_SECONDS });
const cachedLastVoteDate = unstable_cache(findLastVoteDate, ["stats-last-vote"], { revalidate: REVALIDATE_SECONDS });

async function safe<T extends number | string>(key: keyof typeof lastGood, load: () => Promise<T | null>): Promise<T | null> {
  try {
    const value = await load();
    if (value !== null) lastGood[key] = value;
    return value;
  } catch {
    return (lastGood[key] as T | undefined) ?? null;
  }
}

export async function getLiveStats(): Promise<LiveStats> {
  const [activeProjects, comments, lastVoteDate] = await Promise.all([
    safe("activeProjects", cachedActiveProjects),
    safe("citizenComments", cachedCitizenComments),
    safe("lastVoteDate", cachedLastVoteDate),
  ]);
  return {
    activeProjects,
    // 0 санал бол "тоо" гэж харуулах зүйлгүй — нуух
    citizenComments: comments && comments > 0 ? comments : null,
    lastVoteDate,
    updatedAt: new Date().toISOString(),
  };
}
