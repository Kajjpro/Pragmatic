import { HttpError } from "@/lib/auth";
import { BadInputError } from "./pipeline";

export async function readBody(req: Request): Promise<Record<string, unknown>> {
  const body = await req.json().catch(() => null);
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new HttpError(400, "Хүсэлтийн бие буруу байна (JSON объект байх ёстой)");
  }
  return body as Record<string, unknown>;
}

export function str(
  body: Record<string, unknown>,
  key: string,
  opts: { min?: number; max?: number; optional?: boolean } = {},
): string {
  const v = body[key];
  if (v === undefined || v === null || v === "") {
    if (opts.optional) return "";
    throw new HttpError(400, `"${key}" талбар шаардлагатай`);
  }
  if (typeof v !== "string") throw new HttpError(400, `"${key}" нь текст байх ёстой`);
  const t = v.trim();
  if (opts.min && t.length < opts.min) throw new HttpError(400, `"${key}" хэт богино байна`);
  if (opts.max && t.length > opts.max) throw new HttpError(400, `"${key}" хэт урт байна`);
  return t;
}

export function asHttpError(e: unknown): unknown {
  return e instanceof BadInputError ? new HttpError(400, e.message) : e;
}

// Бүхэл тоо (жишээ нь chosenIndex, supportGuess). min/max хоёулаа багтана.
export function int(body: Record<string, unknown>, key: string, opts: { min: number; max: number }): number {
  const v = body[key];
  if (v === undefined || v === null || v === "") throw new HttpError(400, `"${key}" талбар шаардлагатай`);
  if (typeof v !== "number" || !Number.isInteger(v)) throw new HttpError(400, `"${key}" нь бүхэл тоо байх ёстой`);
  if (v < opts.min || v > opts.max) {
    throw new HttpError(400, `"${key}" нь ${opts.min}-${opts.max} хооронд байх ёстой`);
  }
  return v;
}

// true / false
export function bool(body: Record<string, unknown>, key: string): boolean {
  const v = body[key];
  if (v === undefined || v === null) throw new HttpError(400, `"${key}" талбар шаардлагатай`);
  if (typeof v !== "boolean") throw new HttpError(400, `"${key}" нь true/false байх ёстой`);
  return v;
}
