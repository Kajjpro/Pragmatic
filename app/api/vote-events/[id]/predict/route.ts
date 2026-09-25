import { NextResponse } from "next/server";
import { handleError, HttpError, requireUser } from "@/lib/auth";
import { bool, int, readBody } from "@/lib/law/http";
import { savePrediction } from "@/lib/points";
import { MAX_SUPPORT_GUESS, type PredictResult } from "@/lib/types";

// { willPass, supportGuess } → таамаг. Зөвхөн OPEN үед, нэг хэрэглэгч нэг л удаа.
export async function POST(req: Request, ctx: RouteContext<"/api/vote-events/[id]/predict">) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;

    const body = await readBody(req);
    const willPass = bool(body, "willPass");
    const supportGuess = int(body, "supportGuess", { min: 0, max: MAX_SUPPORT_GUESS });

    const r = await savePrediction(user.id, id, willPass, supportGuess);
    if (r.status === "NOT_FOUND") throw new HttpError(404, "Санал хураалт олдсонгүй");
    if (r.status === "CLOSED") throw new HttpError(409, "Энэ санал хураалтад таамаг авахаа больсон");
    if (r.status !== "OK") throw new HttpError(409, "Та энэ санал хураалтад аль хэдийн таамаг өгсөн");

    const result: PredictResult = { prediction: r.prediction, newBadges: r.newBadges };
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
