import { cn } from "@/lib/utils";
import type { Slot } from "@/types";

const SLOT_STYLES: Record<Slot, string> = {
  A: "border-neon-cyan/60 text-neon-cyan shadow-neon-cyan",
  B: "border-neon-magenta/60 text-neon-magenta shadow-neon-magenta",
  C: "border-neon-violet/60 text-neon-violet shadow-neon-violet",
  D: "border-neon-amber/60 text-neon-amber shadow-neon-amber",
};

/** The "Arena Ring" — a glowing hexagonal-feeling badge used for Model A/B/C/D and leaderboard ranks. */
export function SlotBadge({ slot, size = "md" }: { slot: Slot; size?: "sm" | "md" | "lg" }) {
  const dims = size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-14 w-14 text-xl" : "h-10 w-10 text-sm";
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-lg border-2 bg-base-panel font-display font-bold",
        dims,
        SLOT_STYLES[slot]
      )}
      aria-hidden="true"
    >
      {slot}
    </span>
  );
}
