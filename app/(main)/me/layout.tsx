import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Миний оролцоо",
  description: "Таны санал тусгагдсан эсэх, таамгууд, тэмдэг.",
};

export default function MeLayout({ children }: LayoutProps<"/me">) {
  return children;
}
