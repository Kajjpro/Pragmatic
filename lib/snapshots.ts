// data/snapshots/<нэр>.json — бодит API-ийн хариуны хуулбар. `npm run discover` бичнэ.
// DB хоосон үед /api/parliament/*, /api/drafts эндээс уншина (lib/parliament-data.ts).
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const SNAPSHOT_DIR = join(process.cwd(), "data", "snapshots");

// response = API-ийн хариу яг байгаагаараа (LawForum-ын жагсаалтад л бүх хуудсыг нэгтгэсэн)
export type Snapshot = {
  func: string;
  params: Record<string, unknown>;
  fetchedAt: string;
  response: unknown;
};

export function snapshotPath(name: string): string {
  return join(SNAPSHOT_DIR, `${name}.json`);
}

// Файл байхгүй эсвэл эвдэрсэн бол null — дуудсан тал нь хоосон жагсаалт буцаана
export function readSnapshot(name: string): Snapshot | null {
  const path = snapshotPath(name);
  if (!existsSync(path)) return null;
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as Partial<Snapshot> | null;
    if (!parsed || typeof parsed !== "object" || !("response" in parsed)) return null;
    return {
      func: String(parsed.func ?? name),
      params: parsed.params ?? {},
      fetchedAt: String(parsed.fetchedAt ?? ""),
      response: parsed.response,
    };
  } catch {
    return null;
  }
}
