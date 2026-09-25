import { NextResponse } from "next/server";
import { handleError, HttpError, requireStaff } from "@/lib/auth";
import { readBody, str } from "@/lib/law/http";
import { REFLECTIONS, saveGroupReply, type ReflectionValue } from "@/lib/law/queries";
import { awardReflectedForGroup } from "@/lib/points";

export async function POST(req: Request, ctx: RouteContext<"/api/groups/[id]/reply">) {
  try {
    await requireStaff();
    const { id } = await ctx.params;

    const body = await readBody(req);
    const replyText = str(body, "replyText", { min: 1, max: 5000 });
    const reflection = body.reflection;
    if (typeof reflection !== "string" || !(REFLECTIONS as readonly string[]).includes(reflection)) {
      throw new HttpError(400, `"reflection" нь PENDING, REFLECTED эсвэл NOT_REFLECTED байх ёстой`);
    }

    const group = await saveGroupReply(id, replyText, reflection as ReflectionValue);
    if (!group) throw new HttpError(404, "Бүлэг олдсонгүй");

    // "Тусгасан" бол бүлгийн иргэн бүрт +50, "Хууль өөрчилсөн иргэн" тэмдэг, мэдэгдэл (давхардахгүй)
    const rewarded = reflection === "REFLECTED" ? await awardReflectedForGroup(id) : 0;
    return NextResponse.json({ ...group, rewarded });
  } catch (e) {
    return handleError(e);
  }
}
