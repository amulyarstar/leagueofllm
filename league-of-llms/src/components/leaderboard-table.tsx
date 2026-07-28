"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MODEL_CATALOG, type LeaderboardRow } from "@/types";
import { SlotBadge } from "@/components/ui/slot-badge";
import { cn, formatCompactNumber } from "@/lib/utils";
import type { Slot } from "@/types";

const RANK_SLOTS: Slot[] = ["A", "B", "C", "D"];

export function LeaderboardTable({ rows }: { rows: LeaderboardRow[] }) {
  const sorted = [...rows].sort((a, b) => b.elo_rating - a.elo_rating);
  const chartData = sorted.map((r) => ({
    name: MODEL_CATALOG[r.model_name].label,
    elo: r.elo_rating,
  }));

  return (
    <div className="space-y-8">
      <div className="glass p-6">
        <h3 className="mb-4 font-display text-sm font-bold uppercase tracking-wide text-ink-muted">
          ELO ratings
        </h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} />
              <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} domain={[900, "dataMax + 50"]} />
              <Tooltip
                contentStyle={{
                  background: "#10162A",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="elo" fill="#A78BFA" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass overflow-hidden !p-0">
        <table className="w-full text-sm">
          <caption className="sr-only">Model leaderboard ranked by ELO rating</caption>
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-faint">
              <th scope="col" className="px-5 py-3">Rank</th>
              <th scope="col" className="px-5 py-3">Model</th>
              <th scope="col" className="px-5 py-3 text-right">ELO</th>
              <th scope="col" className="px-5 py-3 text-right">Wins</th>
              <th scope="col" className="px-5 py-3 text-right">Losses</th>
              <th scope="col" className="px-5 py-3 text-right">Win rate</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => {
              const model = MODEL_CATALOG[row.model_name];
              const total = row.wins + row.losses;
              const winRate = total > 0 ? Math.round((row.wins / total) * 100) : 0;
              return (
                <tr key={row.model_name} className={cn("border-b border-line last:border-0", i === 0 && "bg-neon-amber/5")}>
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-2">
                      {i < 4 ? <SlotBadge slot={RANK_SLOTS[i]} size="sm" /> : <span className="w-8 text-center text-ink-faint">{i + 1}</span>}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-semibold">{model.label}</p>
                    <p className="text-xs text-ink-faint">{model.vendor}</p>
                  </td>
                  <td className="px-5 py-3 text-right font-mono">{row.elo_rating}</td>
                  <td className="px-5 py-3 text-right font-mono text-neon-green">{formatCompactNumber(row.wins)}</td>
                  <td className="px-5 py-3 text-right font-mono text-neon-red">{formatCompactNumber(row.losses)}</td>
                  <td className="px-5 py-3 text-right font-mono">{winRate}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
