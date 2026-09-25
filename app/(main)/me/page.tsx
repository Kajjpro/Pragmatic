"use client";

import { useEffect, useState } from "react";
import { SignInButton } from "@clerk/nextjs";
import { FileText, Landmark, MessagesSquare } from "lucide-react";
import { useMe } from "@/components/shell/me-context";
import { MyComments } from "@/components/me/my-comments";
import { MyPredictions } from "@/components/me/my-predictions";
import { BadgeList } from "@/components/me/badge-list";
import { LawChangerNotice } from "@/components/me/law-changer-notice";
import { LawChangerHero } from "@/components/me/law-changer-hero";
import { ProposalForm } from "@/components/me/proposal-form";
import { impactStage } from "@/components/me/impact-stepper";
import { Container } from "@/components/ui/page-header";
import { ListSkeleton } from "@/components/ui/page-loading";
import { cn } from "@/lib/cn";

// Нэг удаа харуулсан "Хууль өөрчилсөн иргэн" мэдэгдлийг төхөөрөмж дээр санана
const SEEN_BADGES = "hariu.seenBadges.v1";

function readSeenBadges(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SEEN_BADGES) ?? "[]") as string[];
  } catch {
    return [];
  }
}

type Tab = "comments" | "propose" | "predictions" | "badges";

function Heading() {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-good-fg">Иргэний бодит нөлөө</p>
      <h1 className="text-[30px] font-bold sm:text-[34px]">Би хууль өөрчилсөн</h1>
      <p className="max-w-2xl text-[15.5px] text-muted">
        Таны санал Илгээсэн → Хэлэлцэж байна → Тусгагдсан гэсэн шатаар явна. Тусгагдвал «Хууль өөрчилсөн иргэн» тэмдэг, иргэний нөлөөний батламж авна.
      </p>
    </div>
  );
}

// ⑥ Би хууль өөрчилсөн. Өгөгдөл: GET /api/me (MeProvider), санал илгээх: POST /api/comments.
export default function MePage() {
  const { me, loaded, refresh } = useMe();
  const [tab, setTab] = useState<Tab>("comments");
  const [seen, setSeen] = useState<string[] | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage-г зөвхөн хөтөч дээр уншина
    setSeen(readSeenBadges());
  }, []);

  if (!loaded)
    return (
      <Container className="py-8">
        <Heading />
        <div className="mt-7">
          <ListSkeleton rows={2} />
        </div>
      </Container>
    );

  if (!me) return <GuestView />;

  const comments = me.comments ?? [];
  const predictions = me.predictions ?? [];
  const stages = comments.map(impactStage);
  const newLawChanger = seen ? me.badges.find((b) => b.type === "LAW_CHANGER" && !seen.includes(b.id)) : undefined;

  function dismiss(id: string) {
    const ids = Array.from(new Set([...(seen ?? []), id]));
    setSeen(ids);
    try {
      localStorage.setItem(SEEN_BADGES, JSON.stringify(ids));
    } catch {
      // Хаалттай горимд хадгалахгүй
    }
  }

  const summary = [
    { label: "Илгээсэн", value: comments.length, Icon: FileText, tone: "text-heading" },
    { label: "Хэлэлцэж байна", value: stages.filter((s) => s.step === 2).length, Icon: MessagesSquare, tone: "text-gold-fg" },
    { label: "Тусгагдсан", value: stages.filter((s) => s.outcome === "REFLECTED").length, Icon: Landmark, tone: "text-good-fg" },
  ];

  const tabs: { key: Tab; label: string; n?: number }[] = [
    { key: "comments", label: "Миний санал", n: comments.length },
    { key: "propose", label: "Санал ирүүлэх" },
    { key: "predictions", label: "Таамгууд", n: predictions.length },
    { key: "badges", label: "Тэмдэг", n: me.badges.length },
  ];

  return (
    <Container className="py-8">
      <Heading />

      {newLawChanger ? (
        <div className="mt-6">
          <LawChangerNotice badge={newLawChanger} onClose={() => dismiss(newLawChanger.id)} />
        </div>
      ) : null}

      <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <LawChangerHero badges={me.badges} />
        <dl className="grid grid-cols-3 gap-px self-stretch overflow-hidden rounded-2xl border border-line bg-line">
          {summary.map(({ label, value, Icon, tone }) => (
            <div key={label} className="flex flex-col justify-center bg-surface px-4 py-4">
              <dt className="flex items-center gap-1.5 text-[13px] text-muted">
                <Icon aria-hidden className={cn("h-4 w-4", tone)} /> {label}
              </dt>
              <dd className={cn("mt-1 font-serif text-[30px] font-bold tabular-nums", tone)}>{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div role="tablist" aria-label="Миний оролцоо" className="mt-8 flex gap-1 overflow-x-auto border-b border-line no-scrollbar">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            id={`tab-${t.key}`}
            aria-selected={tab === t.key}
            aria-controls={`panel-${t.key}`}
            onClick={() => setTab(t.key)}
            className={cn(
              "-mb-px min-h-11 shrink-0 border-b-2 px-3 text-[15px] font-medium",
              tab === t.key ? "border-primary text-heading" : "border-transparent text-muted hover:text-fg",
            )}
          >
            {t.label}
            {t.n !== undefined ? <span className="ml-1 tabular-nums text-muted">({t.n})</span> : null}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="mt-6">
        {tab === "comments" ? (
          <MyComments comments={comments} badges={me.badges} onPropose={() => setTab("propose")} />
        ) : tab === "propose" ? (
          <ProposalForm
            onSent={() => {
              refresh();
              setTab("comments");
            }}
          />
        ) : tab === "predictions" ? (
          <MyPredictions rows={predictions} />
        ) : (
          <BadgeList badges={me.badges} />
        )}
      </div>
    </Container>
  );
}

// Нэвтрээгүй: юу болохыг тайлбарлаж, санал ирүүлэх формыг харуулна (илгээхэд нэвтрэхийг хүснэ)
function GuestView() {
  return (
    <Container className="py-8">
      <Heading />
      <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <LawChangerHero badges={[]} />
        <div className="flex flex-col justify-center gap-3 rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <p className="text-[15.5px]">Нэвтэрсний дараа саналынхаа явц, ажлын албаны хариу, таамаг, тэмдгээ энд харна.</p>
          <SignInButton mode="modal">
            <button type="button" className="min-h-11 self-start rounded-lg bg-primary px-5 text-[15px] font-semibold text-on-primary hover:bg-primary-hover">
              Нэвтрэх
            </button>
          </SignInButton>
        </div>
      </div>
      <h2 className="mt-10 text-[22px] font-bold">Санал ирүүлэх</h2>
      <div className="mt-4">
        <ProposalForm onSent={() => {}} />
      </div>
    </Container>
  );
}
