import { NextResponse } from "next/server";
import { handleError, HttpError, requireUser } from "@/lib/auth";
import { isPersona } from "@/lib/feed";
import { readBody } from "@/lib/law/http";
import { prisma } from "@/lib/prisma";
import { PERSONAS, type PersonaResult } from "@/lib/types";

// { persona } → хэрэглэгчийн төрлийг хадгална
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await readBody(req);
    if (!isPersona(body.persona)) {
      throw new HttpError(400, `"persona" нь ${PERSONAS.join(", ")} дотроос байх ёстой`);
    }

    const saved = await prisma.user.update({
      where: { id: user.id },
      data: { persona: body.persona },
      select: { persona: true },
    });
    return NextResponse.json({ persona: saved.persona! } satisfies PersonaResult);
  } catch (e) {
    return handleError(e);
  }
}
