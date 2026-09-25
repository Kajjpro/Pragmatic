import Link from "next/link";

// Хуудасны хөл: эх сурвалж, багийн тухай нэг мөр.
export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-3 px-4 py-8 text-[14px] text-muted sm:px-6 md:flex-row md:items-center md:justify-between">
        <p>Энэ платформыг 12-р ангийн сурагчид бүтээв.</p>
        <p>
          Өгөгдлийн эх сурвалж:{" "}
          <a
            href="https://lawforum.parliament.mn"
            target="_blank"
            rel="noreferrer noopener"
            className="font-medium text-action underline underline-offset-2"
          >
            LawForum
          </a>
          , УИХ-ын санал хураалт (ParliamentAPI).{" "}
          <Link href="/staff" className="font-medium text-action underline underline-offset-2">
            Ажилтны хэсэг
          </Link>
        </p>
      </div>
    </footer>
  );
}
