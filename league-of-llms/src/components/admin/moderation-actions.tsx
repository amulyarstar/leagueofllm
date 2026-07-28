"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface ModerationButtonProps {
  action: "remove" | "restore" | "ban" | "unban";
  battleId?: string;
  userId?: string;
  label: string;
  tone?: "danger" | "default";
}

export function ModerationButton({ action, battleId, userId, label, tone = "default" }: ModerationButtonProps) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleClick() {
    setState("loading");
    try {
      const res = await fetch("/api/admin/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, battleId, userId }),
      });
      setState(res.ok ? "done" : "error");
      if (res.ok) setTimeout(() => window.location.reload(), 400);
    } catch {
      setState("error");
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={state === "loading" || state === "done"}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        tone === "danger"
          ? "border-neon-red/40 text-neon-red hover:bg-neon-red/10"
          : "border-line text-ink-muted hover:bg-white/5 hover:text-white"
      )}
    >
      {state === "loading" ? "Working…" : state === "done" ? "Done" : state === "error" ? "Failed — retry" : label}
    </button>
  );
}
