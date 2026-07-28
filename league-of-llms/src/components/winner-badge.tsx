import { MODEL_CATALOG, type ModelName } from "@/types";
import { Trophy } from "lucide-react";

export function WinnerBadge({ modelName }: { modelName: ModelName }) {
  const model = MODEL_CATALOG[modelName];
  return (
    <div className="glass neon-border-amber flex animate-rise items-center gap-4 p-6">
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 border-neon-amber/60 bg-neon-amber/10 text-neon-amber">
        <Trophy size={24} aria-hidden="true" />
      </span>
      <div>
        <p className="text-xs uppercase tracking-widest text-ink-faint">Best Overall</p>
        <p className="font-display text-2xl font-black uppercase tracking-wide text-neon-amber">
          {model.label}
        </p>
        <p className="text-xs text-ink-faint">by {model.vendor}</p>
      </div>
    </div>
  );
}
