import { NextResponse } from "next/server";
import { getUser, handleError, HttpError } from "@/lib/auth";
import { toOptions } from "@/lib/feed";
import { int, readBody } from "@/lib/law/http";
import { awardQuizAnswer } from "@/lib/points";
import { prisma } from "@/lib/prisma";
import type { QuizAnswerResult } from "@/lib/types";

// { chosenIndex } → зөв эсэх, зөв хариу, тайлбар.
// Нэвтэрсэн бол хадгалж, анхны оролдлого зөв бол +3. Нэвтрээгүй бол зөвхөн хариуг харуулна (saved: false).
export async function POST(req: Request, ctx: RouteContext<"/api/quiz/[id]/answer">) {
  try {
    const { id } = await ctx.params;
    const body = await readBody(req);

    const question = await prisma.quizQuestion.findUnique({
      where: { id },
      select: { id: true, options: true, correctIndex: true, explanation: true },
    });
    if (!question) throw new HttpError(404, "Асуулт олдсонгүй");

    const optionCount = toOptions(question.options).length;
    const chosenIndex = int(body, "chosenIndex", { min: 0, max: optionCount - 1 });

    const user = await getUser();
    if (!user) {
      const guest: QuizAnswerResult = {
        correct: chosenIndex === question.correctIndex,
        correctIndex: question.correctIndex,
        explanation: question.explanation,
        pointsAwarded: 0,
        saved: false,
        points: null,
      };
      return NextResponse.json(guest);
    }

    const r = await awardQuizAnswer(user.id, question.id, chosenIndex);
    if (!r) throw new HttpError(404, "Асуулт олдсонгүй");

    const result: QuizAnswerResult = {
      correct: r.correct,
      correctIndex: r.correctIndex,
      explanation: r.explanation,
      pointsAwarded: r.pointsAwarded,
      saved: true,
      points: r.points,
    };
    return NextResponse.json(result);
  } catch (e) {
    return handleError(e);
  }
}
