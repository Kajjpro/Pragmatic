"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

// Ажилтан: LawForum-ын бүх идэвхтэй төслийг DB руу татна (POST /api/staff/projects/sync)
export function SyncProjectsButton() {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "busy">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function sync() {
    setState("busy");
    setMessage(null);
    try {
      const res = await fetch("/api/staff/projects/sync", { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMessage(data?.error ?? "LawForum-оос татаж чадсангүй.");
        return;
      }
      setMessage(`${data.active} идэвхтэй төсөл: ${data.created} шинэ, ${data.updated} шинэчлэгдсэн.`);
      router.refresh();
    } catch {
      setMessage("Сүлжээний алдаа гарлаа. Дахин оролдоно уу.");
    } finally {
      setState("idle");
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="secondary" onClick={sync} disabled={state === "busy"}>
        <RefreshCw aria-hidden className="h-4 w-4" /> {state === "busy" ? "Татаж байна…" : "LawForum-оос шинэчлэх"}
      </Button>
      {message ? (
        <p aria-live="polite" className="text-[13.5px] text-muted">
          {message}
        </p>
      ) : null}
    </div>
  );
}
