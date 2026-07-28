"use client";

import { Swords } from "lucide-react";

const MAX_LEN = 2000;

export function PromptInput({
  value,
  onChange,
  onSubmit,
  disabled,
  submitting,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  submitting?: boolean;
}) {
  return (
    <div>
      <label htmlFor="prompt" className="mb-2 block text-sm font-medium text-ink-muted">
        Your prompt
      </label>
      <textarea
        id="prompt"
        value={value}
        maxLength={MAX_LEN}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. Write a landing page headline for a productivity app aimed at freelancers…"
        rows={4}
        className="w-full resize-none rounded-xl border border-line bg-white/[0.03] p-4 text-base text-ink placeholder:text-ink-faint focus:border-neon-violet/60 focus:outline-none"
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-ink-faint">{value.length}/{MAX_LEN}</span>
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled || value.trim().length < 3 || submitting}
          className="btn-primary"
        >
          <Swords size={18} aria-hidden="true" />
          {submitting ? "Entering the arena…" : "Battle"}
        </button>
      </div>
    </div>
  );
}
