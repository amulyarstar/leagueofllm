"use client";

import { VOTE_CATEGORIES, type Slot, type VoteCategory } from "@/types";
import { cn } from "@/lib/utils";

const SLOTS: Slot[] = ["A", "B", "C", "D"];

export function VotingPanel({
  availableSlots,
  votes,
  onVote,
  onSubmit,
  submitting,
  disabled,
}: {
  availableSlots: Slot[];
  votes: Partial<Record<VoteCategory, Slot>>;
  onVote: (category: VoteCategory, slot: Slot) => void;
  onSubmit: () => void;
  submitting?: boolean;
  disabled?: boolean;
}) {
  const allVoted = VOTE_CATEGORIES.every((c) => votes[c.id]);

  return (
    <div className="glass p-6">
      <h2 className="font-display text-lg font-bold uppercase tracking-wide">Cast your votes</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Pick a winner in each category. Identities reveal once you submit.
      </p>

      <div className="mt-5 space-y-4">
        {VOTE_CATEGORIES.map((cat) => (
          <fieldset key={cat.id} className="border-t border-line pt-4 first:border-0 first:pt-0">
            <legend className="mb-2 flex flex-col">
              <span className="text-sm font-semibold">{cat.label}</span>
              <span className="text-xs text-ink-faint">{cat.hint}</span>
            </legend>
            <div className="flex gap-2" role="radiogroup" aria-label={cat.label}>
              {SLOTS.filter((s) => availableSlots.includes(s)).map((slot) => (
                <button
                  key={slot}
                  type="button"
                  role="radio"
                  aria-checked={votes[cat.id] === slot}
                  onClick={() => onVote(cat.id, slot)}
                  disabled={disabled}
                  className={cn(
                    "h-10 w-10 rounded-lg border border-line font-display text-sm font-bold transition-colors",
                    votes[cat.id] === slot
                      ? "border-neon-violet bg-neon-violet/20 text-white"
                      : "text-ink-muted hover:bg-white/5"
                  )}
                >
                  {slot}
                </button>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={!allVoted || submitting || disabled}
        className="btn-primary mt-6 w-full"
      >
        {submitting ? "Locking in votes…" : "Submit votes & reveal"}
      </button>
    </div>
  );
}
