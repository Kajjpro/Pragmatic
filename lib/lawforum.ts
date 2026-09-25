// lawforum.parliament.mn API client
// Серверээс дуудна (route handler / server action). Browser-оос дуудвал CORS-оор хаагдаж магадгүй.

// .env: LAWFORUM_API_URL (анхдагч https://lawforum.parliament.mn/LawForumAPI)
const BASE = `${(process.env.LAWFORUM_API_URL || "https://lawforum.parliament.mn/LawForumAPI").replace(/\/+$/, "")}/api/v1`;

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

async function get<T>(
  path: string,
  params?: Record<string, string | number>
): Promise<T> {
  const url = new URL(BASE + path);
  if (params)
    for (const [k, v] of Object.entries(params))
      url.searchParams.set(k, String(v));
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

// ⚠️ Хуудаслалтын параметрийн нэрийг Swagger дээр /projects-ийг нээж шалга (page, pageSize гэж таамагласан).
export const getProjects = (page = 1, pageSize = 50) =>
  get<Paged<ProjectListItem>>("/projects", { page, pageSize });

// "Зөвхөн 5 ирдэг" асуудал нь ихэвчлэн анхдагч pageSize=5 байдагтай холбоотой.
// Энэ функц бүх хуудсыг дамжиж бүх төслийг авна.
export async function getAllProjects(
  pageSize = 50
): Promise<ProjectListItem[]> {
  const first = await getProjects(1, pageSize);
  const all = [...first.items];
  for (let p = 2; p <= first.totalPages; p++) {
    const next = await getProjects(p, pageSize);
    all.push(...next.items);
  }
  return all;
}
