import { MODEL_CATALOG, type ModelName, type Slot } from "@/types";
import { SlotBadge } from "@/components/ui/slot-badge";
import { ResponseSkeleton, LoadingDots } from "@/components/ui/loading-dots";
import { formatLatency, cn } from "@/lib/utils";
import { Crown, Clock, Hash, AlertTriangle } from "lucide-react";

interface ResponseCardProps {
  slot: Slot;
  text: string | null;
  loading?: boolean;
  error?: string | null;
  latencyMs?: number | null;
  tokens?: number | null;
  revealed?: boolean;
  modelName?: ModelName;
  isWinner?: boolean;
}

export function ResponseCard({
  slot,
  text,
  loading,
  error,
  latencyMs,
  tokens,
  revealed,
  modelName,
  isWinner,
}: ResponseCardProps) {
  const model = modelName ? MODEL_CATALOG[modelName] : null;

  return (
    <article
      className={cn(
        "glass glass-hover flex h-full flex-col gap-4 p-5",
        isWinner && "neon-border-amber"
      )}
    >
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <SlotBadge slot={slot} />
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-wide">
              {revealed && model ? model.label : `Model ${slot}`}
            </p>
            <p className="text-[11px] text-ink-faint">{revealed && model ? model.vendor : "Identity hidden"}</p>
          </div>
        </div>
        {isWinner && (
          <span className="flex items-center gap-1 rounded-full border border-neon-amber/50 bg-neon-amber/10 px-2.5 py-1 text-[11px] font-semibold text-neon-amber">
            <Crown size={12} aria-hidden="true" /> Winner
          </span>
        )}
      </header>

      <div className="flex-1">
        {loading ? (
          <div className="space-y-4">
            <ResponseSkeleton />
            <LoadingDots label="Generating response…" />
          </div>
        ) : error ? (
          <p className="flex items-start gap-2 text-sm text-neon-red">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            This model failed to respond: {error}
          </p>
        ) : (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{text}</p>
        )}
      </div>

      {!loading && !error && (
        <footer className="flex items-center gap-4 border-t border-line pt-3 font-mono text-[11px] text-ink-faint">
          <span className="flex items-center gap-1">
            <Clock size={12} aria-hidden="true" /> {formatLatency(latencyMs ?? null)}
          </span>
          <span className="flex items-center gap-1">
            <Hash size={12} aria-hidden="true" /> {tokens ?? "—"} tokens
          </span>
        </footer>
      )}
    </article>
  );
}
