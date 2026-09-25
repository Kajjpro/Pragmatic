import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Таамаг",
  description: "УИХ-ын санал хураалтын дүнг урьдчилан таамаглаж, бодит дүнтэй харьцуулна уу.",
};

export default function PredictLayout({ children }: LayoutProps<"/predict">) {
  return children;
}
