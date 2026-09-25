"use client";

import { useEffect, useState } from "react";
import { SignInButton } from "@clerk/nextjs";
import { useMe } from "@/components/shell/me-context";
import { MyComments } from "@/components/me/my-comments";
import { MyPredictions } from "@/components/me/my-predictions";
import { BadgeList } from "@/components/me/badge-list";
import { LawChangerNotice } from "@/components/me/law-changer-notice";
import { Container, PageHeader } from "@/components/ui/page-header";
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

type Tab = "comments" | "predictions" | "badges";

// ⑥ Миний оролцоо. Өгөгдөл: GET /api/me (MeProvider).
export default function MePage() {
  const { me, loaded } = useMe();
  const [tab, setTab] = useState<Tab>("comments");
  const [seen, setSeen] = useState<string[] | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage-г зөвхөн хөтөч дээр уншина
    setSeen(readSeenBadges());
  }, []);

  if (!loaded)
    return (
      <Container className="max-w-3xl py-10">
        <PageHeader title="Миний оролцоо" description="Таны санал, таамаг, тэмдэг." />
        <div className="mt-6">
          <ListSkeleton rows={2} />
        </div>
      </Container>
    );
  if (!me) return <SignInPrompt />;

  const comments = me.comments ?? [];
  const predictions = me.predictions ?? [];
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

  const tabs: { key: Tab; label: string; n: number }[] = [
    { key: "comments", label: "Миний санал", n: comments.length },
    { key: "predictions", label: "Таамгууд", n: predictions.length },
    { key: "badges", label: "Тэмдэг", n: me.badges.length },
  ];

  return (
    <Container className="max-w-3xl py-10">
      <PageHeader title="Миний оролцоо" description={me.name ? `${me.name}, таны санал, таамаг, тэмдэг.` : "Таны санал, таамаг, тэмдэг."} />

      <dl className="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-line bg-line">
        {[
          ["Оролцооны оноо", me.points.toLocaleString("mn-MN")],
          ["Дараалсан өдөр", String(me.streak)],
          ["Тэмдэг", String(me.badges.length)],
        ].map(([label, value]) => (
          <div key={label} className="bg-surface px-4 py-3">
            <dt className="text-[13.5px] text-muted">{label}</dt>
            <dd className="font-serif text-[26px] font-bold tabular-nums text-heading">{value}</dd>
          </div>
        ))}
      </dl>

      {newLawChanger ? (
        <div className="mt-6">
          <LawChangerNotice badge={newLawChanger} onClose={() => dismiss(newLawChanger.id)} />
        </div>
      ) : null}

      <div role="tablist" aria-label="Миний оролцоо" className="mt-8 flex gap-1 border-b border-line">
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
              "-mb-px min-h-11 border-b-2 px-3 text-[15px] font-medium",
              tab === t.key ? "border-primary text-heading" : "border-transparent text-muted hover:text-fg",
            )}
          >
            {t.label} <span className="tabular-nums text-muted">({t.n})</span>
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="mt-6">
        {tab === "comments" ? <MyComments comments={comments} /> : tab === "predictions" ? <MyPredictions rows={predictions} /> : <BadgeList badges={me.badges} />}
      </div>
    </Container>
  );
}

function SignInPrompt() {
  return (
    <Container className="max-w-3xl py-10">
      <PageHeader title="Миний оролцоо" description="Санал, таамаг, оноо, тэмдгээ хадгалахын тулд нэвтэрнэ үү. Унших нь нэвтрэлтгүй." />
      <div className="mt-6 rounded-lg border border-line bg-surface p-6">
        <p className="text-[16px]">Нэвтэрсний дараа энд харагдах зүйлс:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[15.5px] text-muted">
          <li>Таны өгсөн санал тусгагдсан эсэх, ажлын албаны хариу</li>
          <li>Санал хураалтын таамгууд ба авсан оноо</li>
          <li>«Хууль өөрчилсөн иргэн» гэрчилгээ</li>
        </ul>
        <SignInButton mode="modal">
          <button type="button" className="mt-5 min-h-11 rounded-lg bg-primary px-5 text-[15px] font-semibold text-on-primary hover:bg-primary-hover">
            Нэвтрэх
          </button>
        </SignInButton>
      </div>
    </Container>
  );
}
