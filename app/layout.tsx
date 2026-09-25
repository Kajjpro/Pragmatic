import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { SiteHeader } from "@/components/site/site-header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Монгол Улсын Их Хурал",
  description:
    "Иргэдийн санал, хууль тогтоомжийн хэрэгжилтийн хяналт — Монгол Улсын Их Хурлын албан ёсны платформ",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider>
      <html
        lang="mn"
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}
      >
        <body className="min-h-full bg-white text-ink-900 flex flex-col font-sans">
          <SiteHeader />
          <main className="flex-1">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
