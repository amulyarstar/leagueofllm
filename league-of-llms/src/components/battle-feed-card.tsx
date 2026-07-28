import Link from "next/link";
import { CATEGORY_CATALOG, type BattleRow } from "@/types";
import { timeAgo } from "@/lib/utils";
import { Eye, MessageSquare } from "lucide-react";

export function BattleFeedCard({ battle, voteCount }: { battle: BattleRow; voteCount: number }) {
  const category = CATEGORY_CATALOG.find((c) => c.id === battle.category);

  return (
    <Link href={`/battle/${battle.id}`} className="glass glass-hover block p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="chip">{category?.label ?? battle.category}</span>
        <span className="text-xs text-ink-faint">{timeAgo(battle.created_at)}</span>
      </div>
      <p className="line-clamp-3 text-sm leading-relaxed text-ink">{battle.prompt}</p>
      <div className="mt-4 flex items-center gap-4 text-xs text-ink-faint">
        <span className="flex items-center gap-1">
          <Eye size={14} aria-hidden="true" /> {battle.view_count}
        </span>
        <span className="flex items-center gap-1">
          <MessageSquare size={14} aria-hidden="true" /> {voteCount} votes
        </span>
      </div>
    </Link>
  );
}
