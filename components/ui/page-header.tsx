import type { ReactNode } from "react";

// Хуудасны толгой: гарчиг, нэг өгүүлбэр тайлбар, баруун талд нэмэлт (сонголттой).
export function PageHeader({
  title,
  description,
  eyebrow,
  aside,
}: {
  title: string;
  description?: ReactNode;
  eyebrow?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-line pb-6 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        {eyebrow ? <div className="mb-2 text-[14px] text-muted">{eyebrow}</div> : null}
        <h1 className="text-[28px] font-bold sm:text-[34px]">{title}</h1>
        {description ? <p className="mt-2 text-[16.5px] text-muted">{description}</p> : null}
      </div>
      {aside ? <div className="shrink-0">{aside}</div> : null}
    </div>
  );
}

// Хуудасны агуулгын өргөн (1120px) ба хажуугийн зай
export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1180px] px-4 sm:px-6 ${className}`}>{children}</div>;
}
