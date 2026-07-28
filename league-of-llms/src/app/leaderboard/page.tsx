"use client";

import { useEffect, useState } from "react";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { VOTE_CATEGORIES, type LeaderboardRow, type VoteCategory } from "@/types";
import { cn } from "@/lib/utils";
import { Trophy } from "lucide-react";

const RANGES = [
  { id: "daily", label: "Today" },
  { id: "weekly", label: "This week" },
  { id: "all", label: "All-time" },
] as const;

export default function LeaderboardPage() {
  const [range, setRange] = useState<(typeof RANGES)[number]["id"]>("all");
  const [category, setCategory] = useState<VoteCategory>("overall");
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    fetch(`/api/leaderboard?range=${range}&category=${category}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          if (data.error) setError(data.error);
          else setRows(data.rows);
        }
      })
      .catch(() => !cancelled && setError("Could not load leaderboard."));
    return () => {
      cancelled = true;
    };
  }, [range, category]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl border border-neon-amber/40 bg-neon-amber/10 text-neon-amber">
          <Trophy size={20} aria-hidden="true" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wide">Leaderboard</h1>
          <p className="text-sm text-ink-muted">Ranked by community votes and ELO rating.</p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2" role="tablist" aria-label="Time range">
          {RANGES.map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              className={cn("chip", range === r.id && "chip-active")}
              role="tab"
              aria-selected={range === r.id}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Vote category">
          {VOTE_CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={cn("chip", category === c.id && "chip-active")}
              role="tab"
              aria-selected={category === c.id}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-neon-red">{error}</p>}
      {!rows && !error && <p className="text-sm text-ink-muted">Loading standings…</p>}
      {rows && rows.length === 0 && <p className="text-sm text-ink-muted">No battles recorded for this range yet.</p>}
      {rows && rows.length > 0 && <LeaderboardTable rows={rows} />}
    </div>
  );
}
