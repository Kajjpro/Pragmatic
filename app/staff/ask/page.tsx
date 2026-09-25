"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/cn";
import { demoUser } from "@/lib/stub/context";

type Message = {
  id: string;
  role: "user" | "ai";
  text: string;
  sources?: Array<{ label: string; href: string }>;
};

const suggestions = [
  "Хөдөлмөрийн тухай хуулийн 14 дүгээр зүйлийн шинэ найруулгад иргэдийн санал юу байна?",
  "2026 III улирлын тайлангуудаас улаан флагтай мөрүүдийг харах",
  "Байгаль орчны яамны 3 улирлын биелэлт өмнөх оноос хэрхэн өөрчлөгдсөн бэ?",
  "Ямар зорилтууд хугацаанаас хоцорсон вэ?",
];

const seed: Message[] = [
  {
    id: "m-0",
    role: "ai",
    text: "Сайн байна уу. Танд ямар тайлан, хууль эсвэл иргэдийн санааг харуулах вэ? Товчилж бичихэд болно — эх сурвалжтайгаа хамт хариулъя.",
  },
];

export default function AskPage() {
  const [messages, setMessages] = useState<Message[]>(seed);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, thinking]);

  const send = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      text,
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setThinking(true);
    setTimeout(() => {
      const aiMsg: Message = {
        id: `a-${Date.now()}`,
        role: "ai",
        text: mockAnswer(text),
        sources: mockSources(text),
      };
      setMessages((m) => [...m, aiMsg]);
      setThinking(false);
    }, 900);
  };

  return (
    <div className="flex h-[calc(100vh-16rem)] min-h-[560px] flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-parliament-900">AI туслах</h1>
          <p className="mt-1 text-[13px] text-ink-500">
            Хууль, тайлан, иргэдийн санаанаас түргэн хайж хариулна. Эх сурвалжийг үргэлж заана.
          </p>
        </div>
        <div className="hidden items-center gap-2 rounded-full bg-parliament-50 px-3 py-1.5 text-[11px] font-semibold text-parliament-800 md:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Локал стуб — жинхэнэ LLM-д залгагдаагүй
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-[0_20px_45px_-30px_rgba(15,42,99,0.3)]">
        <div ref={scrollRef} className="scroll-slim flex-1 overflow-y-auto px-6 py-5">
          <div className="mx-auto flex max-w-3xl flex-col gap-4">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
            {thinking ? (
              <MessageBubble
                message={{
                  id: "thinking",
                  role: "ai",
                  text: "...",
                }}
                thinking
              />
            ) : null}
          </div>
        </div>

        {messages.length <= 1 ? (
          <div className="border-t border-ink-100 bg-parliament-50/40 px-6 py-4">
            <div className="mx-auto max-w-3xl">
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-parliament-500">
                Санал болгож буй асуултууд
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="max-w-full truncate rounded-full border border-parliament-100 bg-white px-3 py-1.5 text-left text-[11.5px] font-medium text-parliament-800 transition hover:border-parliament-500"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="border-t border-ink-100 bg-white px-6 py-4"
        >
          <div className="mx-auto flex max-w-3xl items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              rows={1}
              placeholder="Асуултаа бичнэ үү... (Shift+Enter — мөр солих)"
              className="flex-1 resize-none rounded-2xl border border-ink-100 bg-parliament-50/40 px-4 py-3 text-[13px] outline-none transition placeholder:text-ink-500/70 focus:border-parliament-500 focus:bg-white"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className={cn(
                "grid h-11 w-11 place-items-center rounded-2xl transition",
                input.trim()
                  ? "bg-parliament-800 text-white hover:bg-parliament-700"
                  : "cursor-not-allowed bg-ink-100 text-ink-500",
              )}
              aria-label="Илгээх"
            >
              <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                <path
                  d="M4 10h12m0 0-5-5m5 5-5 5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  thinking,
}: {
  message: Message;
  thinking?: boolean;
}) {
  const isUser = message.role === "user";
  return (
    <div
      className={cn(
        "flex animate-rise items-start gap-3",
        isUser && "flex-row-reverse",
      )}
    >
      <span
        className={cn(
          "grid h-8 w-8 flex-none place-items-center rounded-full text-[11px] font-bold",
          isUser
            ? "bg-parliament-800 text-white"
            : "bg-gradient-to-br from-gold-400 to-gold-500 text-parliament-950",
        )}
      >
        {isUser ? demoUser.initial : "AI"}
      </span>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed",
          isUser
            ? "bg-parliament-800 text-white"
            : "bg-parliament-50/60 text-ink-900 ring-1 ring-parliament-100",
        )}
      >
        {thinking ? (
          <span className="inline-flex gap-1">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-parliament-500 [animation-delay:-0.2s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-parliament-500 [animation-delay:-0.1s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-parliament-500" />
          </span>
        ) : (
          <>
            <div className="whitespace-pre-wrap">{message.text}</div>
            {message.sources?.length ? (
              <div className="mt-3 flex flex-wrap gap-1.5 border-t border-parliament-100 pt-2 text-[10.5px] font-semibold uppercase tracking-wider text-parliament-500">
                Эх сурвалж:
                {message.sources.map((s) => (
                  <a
                    key={s.href}
                    href={s.href}
                    className="rounded-full bg-white px-2 py-0.5 font-medium normal-case tracking-normal text-parliament-800 ring-1 ring-parliament-100 transition hover:ring-parliament-500"
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function mockAnswer(q: string) {
  if (/14|хөдөлмөр/i.test(q))
    return "Хөдөлмөрийн тухай хуулийн 14 дүгээр зүйлд 15,492 санал ирсэн байна. Дараах 3 бүлэг тодроо: (1) интернэт зардал тодорхойгүй — 2,140 эсэргүүцсэн; (2) зайн ажлын хяналт нууцад халдана — 890; (3) эмэгтэйчүүдэд ач холбогдолтой — 5,820 дэмжсэн. Комисс 14.3-т тодотгол оруулах хариу гаргасан.";
  if (/улаан|флаг|red/i.test(q))
    return "2026 III улирлын 3 тайлангаас нийт 7 өндөр эрсдэлт мөр илэрсэн. HL-2026-042 (Хөдөлмөр) ба AG-2026-017 (Эрчим хүч) хамгийн их зөрүүтэй. Дэлгэрэнгүйг тайлан шалгагч хэсгээс харна уу.";
  if (/байгаль|агаар/i.test(q))
    return "Байгаль орчны яамны 2026 III улирлын биелэлт өмнөх улирлаас 12% сайжирсан боловч дулааны станцын хэмжигчийн API өгөгдөл дутуу байгаа нь өндөр эрсдэлт мөрөөр тэмдэглэгдсэн.";
  if (/хоцор|off|risk/i.test(q))
    return "Одоогийн байдлаар 8 зорилт хугацаанаас хоцорсон. HL-2026-042, AG-2026-017 хамгийн эрсдэлтэй. Хугацаандаа 71% байна.";
  return "Асуултыг ойлголоо. Одоо стуб хариу үзүүлж байна — жинхэнэ LLM-д залгах цагт эх сурвалжтай илүү нарийвчилсан хариу өгнө.";
}

function mockSources(q: string): Array<{ label: string; href: string }> {
  if (/14|хөдөлмөр/i.test(q))
    return [
      { label: "Хөдөлмөрийн тухай хууль 14", href: "/laws/hodolmor-2026" },
      { label: "Иргэдийн бүлгүүд", href: "/staff/laws/hodolmor-2026/feedback" },
    ];
  if (/улаан|флаг/i.test(q))
    return [
      { label: "Тайлан rep-2026q3-hns", href: "/staff/reports/rep-2026q3-hns" },
      { label: "HL-2026-042", href: "/directives/dir-042" },
    ];
  return [{ label: "Ажилтны булан", href: "/staff" }];
}
