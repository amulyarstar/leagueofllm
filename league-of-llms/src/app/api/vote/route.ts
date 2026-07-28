import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { applyRoundRobinElo } from "@/lib/elo";
import type { ModelName, Slot, VoteCategory } from "@/types";

const VoteSchema = z.object({
  battleId: z.string().uuid(),
  anonSessionId: z.string().optional(),
  votes: z.object({
    overall: z.enum(["A", "B", "C", "D"]),
    accuracy: z.enum(["A", "B", "C", "D"]),
    creativity: z.enum(["A", "B", "C", "D"]),
    helpfulness: z.enum(["A", "B", "C", "D"]),
  }),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const parsed = VoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid vote payload.", details: parsed.error.flatten() }, { status: 400 });
  }
  const { battleId, votes, anonSessionId } = parsed.data;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !anonSessionId) {
    return NextResponse.json({ error: "Missing voter identity." }, { status: 400 });
  }

  const service = createServiceClient();

  const { data: battle } = await service.from("battles").select("*").eq("id", battleId).single();
  if (!battle) return NextResponse.json({ error: "Battle not found." }, { status: 404 });

  const modelSlots = battle.model_slots as Partial<Record<Slot, ModelName>>;
  const modelsInBattle = Object.values(modelSlots).filter(Boolean) as ModelName[];

  // Insert one vote row per category. Unique constraints prevent double-voting.
  const rows = (Object.entries(votes) as [VoteCategory, Slot][]).map(([category, slot]) => ({
    battle_id: battleId,
    user_id: user?.id ?? null,
    anon_session: user ? null : anonSessionId,
    category,
    selected_model: modelSlots[slot],
  }));

  const { error: voteError } = await service.from("votes").insert(rows);
  if (voteError) {
    if (voteError.code === "23505") {
      return NextResponse.json({ error: "You already voted on this battle." }, { status: 409 });
    }
    return NextResponse.json({ error: "Could not record votes." }, { status: 500 });
  }

  // Update ELO + win/loss counters per category, round-robin against every other model shown.
  const today = new Date().toISOString().slice(0, 10);

  for (const [category, slot] of Object.entries(votes) as [VoteCategory, Slot][]) {
    const winner = modelSlots[slot];
    if (!winner) continue;

    const { data: leaderboardRows } = await service
      .from("leaderboard")
      .select("*")
      .eq("category", category)
      .in("model_name", modelsInBattle);

    const ratings: Record<string, number> = Object.fromEntries(
      (leaderboardRows ?? []).map((r: { model_name: string; elo_rating: number }) => [r.model_name, r.elo_rating])
    );
    for (const m of modelsInBattle) if (!(m in ratings)) ratings[m] = 1200;

    const updatedRatings = applyRoundRobinElo(ratings, winner);

    for (const model of modelsInBattle) {
      const isWinner = model === winner;
      await service
        .from("leaderboard")
        .update({
          elo_rating: updatedRatings[model],
          wins: isWinner ? (leaderboardRows?.find((r: any) => r.model_name === model)?.wins ?? 0) + 1
                         : leaderboardRows?.find((r: any) => r.model_name === model)?.wins ?? 0,
          losses: !isWinner ? (leaderboardRows?.find((r: any) => r.model_name === model)?.losses ?? 0) + 1
                            : leaderboardRows?.find((r: any) => r.model_name === model)?.losses ?? 0,
          updated_at: new Date().toISOString(),
        })
        .eq("model_name", model)
        .eq("category", category);

      const { data: dailyRow } = await service
        .from("leaderboard_daily")
        .select("*")
        .eq("day", today)
        .eq("model_name", model)
        .eq("category", category)
        .maybeSingle();

      await service.from("leaderboard_daily").upsert({
        day: today,
        model_name: model,
        category,
        wins: (dailyRow?.wins ?? 0) + (isWinner ? 1 : 0),
        losses: (dailyRow?.losses ?? 0) + (isWinner ? 0 : 1),
      });
    }
  }

  await service.from("battles").update({ status: "completed" }).eq("id", battleId);

  return NextResponse.json({ modelSlots, revealed: true });
}
