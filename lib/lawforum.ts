// lawforum.parliament.mn-ийн LawForumAPI client (хуулийн төслүүд). Зөвхөн серверээс дуудна.
// .env: LAWFORUM_API_URL (анхдагч https://lawforum.parliament.mn/LawForumAPI)
//
// Нэвтрэлт шаардахгүй (OpenAPI: {LAWFORUM_API_URL}/swagger/v1/swagger.json, UI: /docs/). Бүх endpoint GET:
//   /api/v1/projects?page&pageSize&typeId&categoryId&search   — хуудаслалттай жагсаалт (pageSize 1–100)
//   /api/v1/projects/{id}                                     — дэлгэрэнгүй + статистик
//   /api/v1/project-categories, /api/v1/project-types
// Хариуны жишээ: data/snapshots/lawforum-*.json (npm run discover)

import "server-only";

const BASE = `${(process.env.LAWFORUM_API_URL || "https://lawforum.parliament.mn/LawForumAPI").replace(/\/+$/, "")}/api/v1`;

export const MAX_PAGE_SIZE = 100; // API үүнээс их бол 400 "pageSize must be between 1 and 100"

export type ProjectStatistics = {
  hits: number;
  comments: number;
  likes: number;
  dislikes: number;
  follows: number;
};

export type ProjectListItem = {
  id: number;
  title: string | null;
  projectNumber: string | null;
  typeId: number;
  typeTitle: string | null;
  categoryId: number;
  categoryTitle: string | null;
  status: number;
  stage: number;
  publishedOnUtc: string | null;
  isActive: boolean;
};

export type ProjectDetail = ProjectListItem & {
  description: string | null;
  slugUrl: string | null;
  createdOnUtc: string | null;
  updatedOnUtc: string | null;
  implementFromUtc: string | null;
  isAllowComments: boolean;
  statistics: ProjectStatistics | null;
};

export type Paged<T> = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  items: T[];
};

export type ProjectCategory = {
  id: number;
  name: string | null;
  title: string | null;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
};

export type ProjectType = {
  id: number;
  title: string | null;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
};

export type ProjectFilter = { typeId?: number; categoryId?: number; search?: string };

// Төслийн нийтэд харагдах хуудас
export function lawforumPageUrl(id: number): string {
  return `https://lawforum.parliament.mn/project/${id}`;
}

// "2026-09-22T16:00:00" — нэр нь *Utc боловч "Z" байхгүй тул new Date() шууд өгвөл компьютерийн цагийн бүсээр
// уншиж 8 цаг зөрнө. UTC гэж уншина.
export function lawforumDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(/(Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : `${value}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function get<T>(
  path: string,
  params?: Record<string, string | number | undefined>
): Promise<T> {
  const url = new URL(BASE + path);
  if (params)
    for (const [k, v] of Object.entries(params))
      if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  const res = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(10_000), // LawForum удаан бол хүлээхгүй
  });
  if (!res.ok) throw new Error(`lawforum ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

export const getCategories = () =>
  get<ProjectCategory[]>("/project-categories");
export const getTypes = () => get<ProjectType[]>("/project-types");
export const getProject = (id: number) => get<ProjectDetail>(`/projects/${id}`);

export const getProjects = (page = 1, pageSize = MAX_PAGE_SIZE, filter: ProjectFilter = {}) =>
  get<Paged<ProjectListItem>>("/projects", { page, pageSize: Math.min(pageSize, MAX_PAGE_SIZE), ...filter });

// Анхдагч pageSize жижиг тул бүх хуудсыг дамжиж бүх төслийг авна (одоо ~1000 төсөл = 11 хуудас)
export async function getAllProjects(
  pageSize = MAX_PAGE_SIZE
): Promise<ProjectListItem[]> {
  const first = await getProjects(1, pageSize);
  const all = [...first.items];
  for (let p = 2; p <= first.totalPages; p++) {
    const next = await getProjects(p, pageSize);
    all.push(...next.items);
  }
  return all;
}
