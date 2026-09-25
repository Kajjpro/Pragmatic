import { HomeShell } from "@/components/home/home-shell";
import { laws } from "@/lib/stub/laws";
import { getAllDirectives } from "@/lib/stub/reports";

export default function HomePage() {
  return <HomeShell laws={laws} directives={getAllDirectives()} />;
}
