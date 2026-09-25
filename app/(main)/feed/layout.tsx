import type { Metadata } from "next";

// /feed нь client component тул metadata-г энэ layout-оор өгнө.
export const metadata: Metadata = {
  title: "Өнөөдрийн хууль",
  description: "Нэг хуулийн өөрчлөлтийг 60 секундэд: өмнө нь ямар байсан, ямар болох, танд юу хамаатай.",
};

export default function FeedLayout({ children }: LayoutProps<"/feed">) {
  return children;
}
