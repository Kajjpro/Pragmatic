import { NextResponse } from "next/server";
import { getUser, handleError, HttpError, requireStaff } from "@/lib/auth";
import { asHttpError, readBody, str } from "@/lib/law/http";
import { createBill } from "@/lib/law/pipeline";
import { getBillList } from "@/lib/law/queries";
import { STAGES, type Stage } from "@/lib/law/types";

export const maxDuration = 300;

export async function GET() {
  try {
    const user = await getUser();
    return NextResponse.json(await getBillList(user?.role === "STAFF"));
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    await requireStaff();
    const body = await readBody(req);

    const stage = body.stage ?? "DISCUSS_DECISION";
    if (typeof stage !== "string" || !(STAGES as readonly string[]).includes(stage)) {
      throw new HttpError(400, `"stage" нь ${STAGES.join(", ")} дотроос байх ёстой`);
    }

    const input = {
      title: str(body, "title", { max: 300 }),
      stage: stage as Stage,
      currentLawText: str(body, "currentLawText"),
      amendmentText: str(body, "amendmentText"),
      reasonText: str(body, "reasonText", { optional: true }) || null,
    };
    const { id } = await createBill(input);
    return NextResponse.json({ id }, { status: 201 });
  } catch (e) {
    return handleError(asHttpError(e));
  }
}
