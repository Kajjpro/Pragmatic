import type { Metadata } from "next";

// /feed нь client component тул metadata-г энэ layout-оор өгнө.
export const metadata: Metadata = {
  title: "Өнөөдрийн хууль",
  description:
    "Нэг карт — 60 секунд. Хуулийн өөрчлөлтийг энгийн үгээр уншаад богино викторт хариул, оноо цуглуул.",
  openGraph: {
    siteName: "Хариу",
    locale: "mn_MN",
    type: "website",
    title: "Өнөөдрийн хууль · Хариу",
    description: "Нэг карт — 60 секунд. Уншаад викторт хариул, streak үүсгэ.",
  },
};

export default function FeedLayout({ children }: LayoutProps<"/feed">) {
  return children;
}
