"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { StatusPill } from "@/components/ui/status-pill";

type State = "draft" | "editing" | "approved";

export function ReplyEditor({
  seedDraft,
  onApprove,
}: {
  seedDraft: string;
  onApprove?: (text: string) => void;
}) {
  const [state, setState] = useState<State>("draft");
  const [text, setText] = useState(seedDraft);
  const [regenerating, setRegenerating] = useState(false);

  return (
    <div className="rounded-2xl border border-parliament-100 bg-parliament-50/40 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-parliament-700 ring-1 ring-parliament-100">
            <svg viewBox="0 0 20 20" fill="none" className="h-3 w-3">
              <path
                d="M10 3v14M5 8l5-5 5 5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <h4 className="text-[12.5px] font-semibold text-parliament-900">
            AI ноорог хариу
          </h4>
          {state === "approved" ? (
            <StatusPill tone="good">Батлагдсан</StatusPill>
          ) : state === "editing" ? (
            <StatusPill tone="warn">Засаж буй</StatusPill>
          ) : (
            <StatusPill tone="info">Ноорог</StatusPill>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setRegenerating(true);
            setTimeout(() => {
              setRegenerating(false);
              setText(
                seedDraft +
                  " Комиссын дараагийн хуралдаанаар нэмэлт судлах болно.",
              );
            }, 700);
          }}
          className="inline-flex items-center gap-1.5 rounded-full border border-parliament-100 bg-white px-3 py-1 text-[11px] font-semibold text-parliament-800 transition hover:border-parliament-500"
        >
          <svg
            viewBox="0 0 20 20"
            fill="none"
            className={cn("h-3 w-3", regenerating && "animate-spin")}
          >
            <path
              d="M15 8A5 5 0 0 0 6 5l-2 3M5 12a5 5 0 0 0 9 3l2-3M15 3v5h-5M5 17v-5h5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Дахин үүсгэх
        </button>
      </div>

      <textarea
        rows={5}
        value={text}
        readOnly={state !== "editing"}
        onChange={(e) => setText(e.target.value)}
        className={cn(
          "mt-3 w-full resize-none rounded-lg border px-3 py-2.5 text-[13px] leading-relaxed outline-none transition",
          state === "editing"
            ? "border-parliament-500 bg-white"
            : "border-transparent bg-white",
        )}
      />

      <div className="mt-3 flex items-center justify-between text-[10.5px] text-ink-500">
        <div>
          Хариу нь тухайн иргэдийн бүлэгт нээлттэй нийтлэгдэнэ.
        </div>
        <div className="flex items-center gap-2">
          {state === "approved" ? (
            <button
              type="button"
              onClick={() => setState("editing")}
              className="rounded-full border border-ink-100 px-3 py-1 text-[11px] font-semibold text-ink-700 transition hover:border-parliament-500 hover:text-parliament-800"
            >
              Дахин засах
            </button>
          ) : state === "editing" ? (
            <>
              <button
                type="button"
                onClick={() => setState("draft")}
                className="rounded-full border border-ink-100 px-3 py-1 text-[11px] font-semibold text-ink-500 transition hover:text-ink-900"
              >
                Цуцлах
              </button>
              <button
                type="button"
                onClick={() => {
                  setState("approved");
                  onApprove?.(text);
                }}
                className="rounded-full bg-parliament-800 px-3.5 py-1 text-[11px] font-semibold text-white transition hover:bg-parliament-700"
              >
                Батлах
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setState("editing")}
                className="rounded-full border border-parliament-100 px-3 py-1 text-[11px] font-semibold text-parliament-800 transition hover:border-parliament-500"
              >
                Засах
              </button>
              <button
                type="button"
                onClick={() => {
                  setState("approved");
                  onApprove?.(text);
                }}
                className="rounded-full bg-parliament-800 px-3.5 py-1 text-[11px] font-semibold text-white transition hover:bg-parliament-700"
              >
                Шууд батлах
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
