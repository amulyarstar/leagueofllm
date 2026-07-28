import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { VoteCategory } from "@/types";

const RANGE_DAYS: Record<string, number | null> = { daily: 1, weekly: 7, all: null };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") ?? "all";
  const category = (searchParams.get("category") ?? "overall") as VoteCategory;

  const service = createServiceClient();

  if (range === "all") {
    const { data, error } = await service
      .from("leaderboard")
      .select("*")
      .eq("category", category)
      .order("elo_rating", { ascending: false });

    if (error) return NextResponse.json({ error: "Could not load leaderboard." }, { status: 500 });
    return NextResponse.json({ rows: data });
  }

  const days = RANGE_DAYS[range] ?? 7;
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);

  const { data: dailyRows, error } = await service
    .from("leaderboard_daily")
    .select("*")
    .eq("category", category)
    .gte("day", since);

  if (error) return NextResponse.json({ error: "Could not load leaderboard." }, { status: 500 });

  const { data: eloRows } = await service.from("leaderboard").select("model_name, elo_rating").eq("category", category);
  const eloMap = Object.fromEntries((eloRows ?? []).map((r: any) => [r.model_name, r.elo_rating]));

  const aggregated = new Map<string, { wins: number; losses: number }>();
  for (const row of dailyRows ?? []) {
    const existing = aggregated.get(row.model_name) ?? { wins: 0, losses: 0 };
    aggregated.set(row.model_name, { wins: existing.wins + row.wins, losses: existing.losses + row.losses });
  }

  const rows = Array.from(aggregated.entries()).map(([model_name, stats]) => ({
    model_name,
    category,
    wins: stats.wins,
    losses: stats.losses,
    ties: 0,
    elo_rating: eloMap[model_name] ?? 1200,
    updated_at: new Date().toISOString(),
  }));

  return NextResponse.json({ rows });
}
