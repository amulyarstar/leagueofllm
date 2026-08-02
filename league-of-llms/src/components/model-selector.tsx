"use client";

import { MODEL_CATALOG, type ModelName } from "@/types";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const COLOR_RING: Record<string, string> = {
  cyan: "border-neon-cyan/70 bg-neon-cyan/10 text-neon-cyan",
  magenta: "border-neon-magenta/70 bg-neon-magenta/10 text-neon-magenta",
  violet: "border-neon-violet/70 bg-neon-violet/10 text-neon-violet",
  amber: "border-neon-amber/70 bg-neon-amber/10 text-neon-amber",
  green: "border-neon-green/70 bg-neon-green/10 text-neon-green",
  red: "border-neon-red/70 bg-neon-red/10 text-neon-red",
};

// Only models with real, working API keys configured — update this list
// whenever you add another provider's key.
const AVAILABLE_MODELS: ModelName[] = ["gemini", "mistral"];

export function ModelSelector({
  selected,
  onToggle,
}: {
  selected: ModelName[];
  onToggle: (model: ModelName) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <p className="text-sm font-medium text-ink-muted">Choose 2–4 contenders</p>
        <p className="text-xs text-ink-faint">{selected.length}/4 selected</p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {Object.values(MODEL_CATALOG)
          .filter((model) => AVAILABLE_MODELS.includes(model.id))
          .map((model) => {
            const isSelected = selected.includes(model.id);
            return (
              <button
                key={model.id}
                type="button"
                onClick={() => onToggle(model.id)}
                aria-pressed={isSelected}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-xl border border-line bg-white/[0.02] px-3 py-3 text-left transition-all duration-200 hover:bg-white/[0.05]",
                  isSelected && COLOR_RING[model.color]
                )}
              >
                <span>
                  <span className="block text-sm font-semibold">{model.label}</span>
                  <span className="block text-[11px] text-ink-faint">{model.vendor}</span>
                </span>
                {isSelected && <Check size={16} aria-hidden="true" />}
              </button>
            );
          })}
      </div>
    </div>
  );
}
