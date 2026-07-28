import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BattleFeedCard } from "@/components/battle-feed-card";
import { CATEGORY_CATALOG, type BattleRow, type PromptCategory } from "@/types";
import { cn } from "@/lib/utils";
import { Rss } from "lucide-react";

export const dynamic = "force-dynamic";

async function getPublicBattles(category?: string) {
  const supabase = createClient();
  let query = supabase
    .from("battles")
    .select("*")
    .eq("visibility", "public")
    .eq("status", "completed")
    .order("view_count", { ascending: false })
    .limit(30);

  if (category) query = query.eq("category", category);

  const { data } = await query;
  return (data ?? []) as BattleRow[];
}

async function getVoteCounts(battleIds: string[]) {
  if (battleIds.length === 0) return {};
  const supabase = createClient();
  const { data } = await supabase.from("votes").select("battle_id").in("battle_id", battleIds);
  const counts: Record<string, number> = {};
  for (const row of data ?? []) counts[row.battle_id] = (counts[row.battle_id] ?? 0) + 1;
  return counts;
}

export default async function FeedPage({ searchParams }: { searchParams: { category?: string } }) {
  const battles = await getPublicBattles(searchParams.category);
  const voteCounts = await getVoteCounts(battles.map((b) => b.id));

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl border border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan">
          <Rss size={20} aria-hidden="true" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wide">Public feed</h1>
          <p className="text-sm text-ink-muted">Trending battles published by the community.</p>
        </div>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        <Link href="/feed" className={cn("chip", !searchParams.category && "chip-active")}>
          All
        </Link>
        {CATEGORY_CATALOG.map((c) => (
          <Link
            key={c.id}
            href={`/feed?category=${c.id}`}
            className={cn("chip", searchParams.category === c.id && "chip-active")}
          >
            {c.label}
          </Link>
        ))}
      </div>

      {battles.length === 0 ? (
        <div className="glass p-10 text-center text-ink-muted">
          No public battles yet in this category. Start one from the arena and publish it after voting.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {battles.map((battle) => (
            <BattleFeedCard key={battle.id} battle={battle} voteCount={voteCounts[battle.id] ?? 0} />
          ))}
        </div>
      )}
    </div>
  );
}
