import { NextResponse } from "next/server";
import { getUser, handleError, HttpError } from "@/lib/auth";
import { findFileQuestion, toOptions } from "@/lib/feed";
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

    // DB-гүй үеийн карт (data/precomputed.json) — хариуг харуулна, оноо хадгалахгүй
    const fileQuestion = findFileQuestion(id);
    if (fileQuestion) {
      const chosen = int(body, "chosenIndex", { min: 0, max: fileQuestion.options.length - 1 });
      const demo: QuizAnswerResult = {
        correct: chosen === fileQuestion.correctIndex,
        correctIndex: fileQuestion.correctIndex,
        explanation: fileQuestion.explanation,
        pointsAwarded: 0,
        saved: false,
        points: null,
      };
      return NextResponse.json(demo);
    }

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
