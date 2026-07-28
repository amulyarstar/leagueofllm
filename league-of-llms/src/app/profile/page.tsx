import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY_CATALOG, type BattleRow } from "@/types";
import { timeAgo } from "@/lib/utils";
import { User, History, Heart, Bookmark } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single();
  const { data: history } = await supabase
    .from("battles")
    .select("*")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false })
    .limit(20);
  const { data: favorites } = await supabase
    .from("favorite_prompts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const { data: saved } = await supabase
    .from("saved_comparisons")
    .select("*, battles(prompt, category)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-12 sm:px-6 lg:px-8">
      <div className="glass flex items-center gap-4 p-6">
        <span className="grid h-16 w-16 place-items-center rounded-full border border-neon-violet/40 bg-neon-violet/10 text-neon-violet">
          <User size={28} aria-hidden="true" />
        </span>
        <div>
          <h1 className="font-display text-xl font-bold">{profile?.name ?? "Challenger"}</h1>
          <p className="text-sm text-ink-muted">{profile?.email}</p>
          <p className="mt-1 text-xs text-ink-faint">Joined {timeAgo(profile?.created_at ?? user.created_at)}</p>
        </div>
      </div>

      <section>
        <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-ink-muted">
          <History size={16} aria-hidden="true" /> Battle history
        </h2>
        {!history || history.length === 0 ? (
          <p className="text-sm text-ink-faint">No battles yet — start one from the arena.</p>
        ) : (
          <div className="space-y-2">
            {(history as BattleRow[]).map((b) => (
              <Link key={b.id} href={`/battle/${b.id}`} className="glass glass-hover flex items-center justify-between p-4">
                <div>
                  <p className="line-clamp-1 text-sm">{b.prompt}</p>
                  <p className="text-xs text-ink-faint">
                    {CATEGORY_CATALOG.find((c) => c.id === b.category)?.label} · {timeAgo(b.created_at)}
                  </p>
                </div>
                <span className="chip">{b.visibility}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-ink-muted">
          <Heart size={16} aria-hidden="true" /> Favorite prompts
        </h2>
        {!favorites || favorites.length === 0 ? (
          <p className="text-sm text-ink-faint">Nothing favorited yet.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {favorites.map((f) => (
              <div key={f.id} className="glass p-4 text-sm text-ink-muted">{f.prompt}</div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-ink-muted">
          <Bookmark size={16} aria-hidden="true" /> Saved comparisons
        </h2>
        {!saved || saved.length === 0 ? (
          <p className="text-sm text-ink-faint">You haven&apos;t saved any comparisons yet.</p>
        ) : (
          <div className="space-y-2">
            {saved.map((s: any) => (
              <Link key={s.id} href={`/battle/${s.battle_id}`} className="glass glass-hover block p-4 text-sm">
                {s.battles?.prompt}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
