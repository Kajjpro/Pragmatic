import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

// Manrope — кирилл үсэг дэмждэг, зузаан гарчигт тохиромжтой.
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  // Хуваалцах үеийн OG зургийн замыг бүтэн URL болгоно
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Хариу — Хууль 60 секундэд",
  description:
    "Хуулийг 60 секундийн картаар ойлго, санал хураалтыг таамагла, саналаа хуульд тусга. Монгол Улсын Их Хурлыг залуучуудад ойртуулах платформ.",
};

// Гар утсанд зориулсан — хэмжээг нь өөрчлөх боломжтой (хандалтын шаардлага)
export const viewport: Viewport = {
  themeColor: "#2e1065",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider>
      <html lang="mn" className={`${manrope.variable} h-full antialiased`}>
        <body className="min-h-full bg-white font-sans text-ink-900">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
