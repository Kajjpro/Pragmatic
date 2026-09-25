import type { Metadata, Viewport } from "next";
import { Inter, PT_Serif } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

// Гарчиг — PT Serif, бусад текст — Inter. Хоёулаа кирилл үсэг дэмждэг.
const ptSerif = PT_Serif({
  variable: "--font-pt-serif",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const TITLE = "Хариу — Хууль таны амьдралыг өөрчилдөг";
const DESCRIPTION =
  "Улсын Их Хурал хуульд юу өөрчилж байгааг энгийнээр ойлгож, санал хураалтыг дагаж, саналаа өгөх платформ. Эх сурвалж: LawForum, УИХ-ын санал хураалт.";

export const metadata: Metadata = {
  // Хуваалцах үеийн OG зургийн замыг бүтэн URL болгоно
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  applicationName: "Хариу",
  title: { default: TITLE, template: "%s · Хариу" },
  description: DESCRIPTION,
  openGraph: {
    siteName: "Хариу",
    locale: "mn_MN",
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0F2A4A" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1220" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider>
      <html lang="mn" className={`${ptSerif.variable} ${inter.variable} h-full antialiased`}>
        <body className="min-h-full bg-page font-sans text-fg">{children}</body>
      </html>
    </ClerkProvider>
  );
}
