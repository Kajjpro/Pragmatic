import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { Container } from "@/components/ui/page-header";
import { buttonClass } from "@/components/ui/button";

// Олдоогүй хуудас (404)
export default function NotFound() {
  return (
    <AppShell>
      <Container className="py-20">
        <p className="text-[14px] font-medium text-muted">404</p>
        <h1 className="mt-2 text-[30px] font-bold">Хуудас олдсонгүй</h1>
        <p className="mt-3 max-w-xl text-muted">
          Таны хайсан хуудас байхгүй эсвэл зөөгдсөн байна. Хаягаа шалгах эсвэл нүүр хуудас руу буцна уу.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/" className={buttonClass("primary")}>
            Нүүр хуудас
          </Link>
          <Link href="/bills" className={buttonClass("secondary")}>
            Хуулийн өөрчлөлтүүд
          </Link>
        </div>
      </Container>
    </AppShell>
  );
}
