import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { AnalyticsChart } from "@/components/admin/analytics-chart";
import { ModerationButton } from "@/components/admin/moderation-actions";
import { timeAgo } from "@/lib/utils";
import { Users, Swords, Flag, BarChart3 } from "lucide-react";

export const dynamic = "force-dynamic";

function bucketByDay(rows: { created_at: string }[], days: number) {
  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    buckets.set(d, 0);
  }
  for (const row of rows) {
    const d = row.created_at.slice(0, 10);
    if (buckets.has(d)) buckets.set(d, (buckets.get(d) ?? 0) + 1);
  }
  return Array.from(buckets.entries()).map(([day, battles]) => ({ day: day.slice(5), battles }));
}

export default async function AdminPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "moderator"].includes(profile.role)) {
    redirect("/");
  }

  const service = createServiceClient();

  const [{ count: userCount }, { count: battleCount }, { count: voteCount }, { data: recentBattles }, { data: flagged }, { data: users }] =
    await Promise.all([
      service.from("users").select("id", { count: "exact", head: true }),
      service.from("battles").select("id", { count: "exact", head: true }),
      service.from("votes").select("id", { count: "exact", head: true }),
      service.from("battles").select("created_at").order("created_at", { ascending: false }).limit(500),
      service
        .from("battles")
        .select("*")
        .in("status", ["flagged"])
        .order("created_at", { ascending: false })
        .limit(20),
      service.from("users").select("*").order("created_at", { ascending: false }).limit(25),
    ]);

  const chartData = bucketByDay(recentBattles ?? [], 14);

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-12 sm:px-6 lg:px-8">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide">Admin dashboard</h1>
        <p className="text-sm text-ink-muted">Signed in as {profile.role}.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Users} label="Total users" value={userCount ?? 0} color="cyan" />
        <StatCard icon={Swords} label="Total battles" value={battleCount ?? 0} color="violet" />
        <StatCard icon={BarChart3} label="Total votes" value={voteCount ?? 0} color="amber" />
      </div>

      <section className="glass p-6">
        <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-wide text-ink-muted">
          Battles created — last 14 days
        </h2>
        <AnalyticsChart data={chartData} />
      </section>

      <section>
        <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-ink-muted">
          <Flag size={16} aria-hidden="true" /> Flagged battles
        </h2>
        {!flagged || flagged.length === 0 ? (
          <p className="text-sm text-ink-faint">Nothing flagged right now.</p>
        ) : (
          <div className="space-y-2">
            {flagged.map((b: any) => (
              <div key={b.id} className="glass flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="line-clamp-1 text-sm">{b.prompt}</p>
                  <p className="text-xs text-ink-faint">{b.flagged_reason ?? "unspecified"} · {timeAgo(b.created_at)}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <ModerationButton action="remove" battleId={b.id} label="Remove" tone="danger" />
                  <ModerationButton action="restore" battleId={b.id} label="Restore" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-wide text-ink-muted">Users</h2>
        <div className="glass overflow-hidden !p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-faint">
                <th scope="col" className="px-5 py-3">Name</th>
                <th scope="col" className="px-5 py-3">Email</th>
                <th scope="col" className="px-5 py-3">Role</th>
                <th scope="col" className="px-5 py-3">Status</th>
                <th scope="col" className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(users ?? []).map((u: any) => (
                <tr key={u.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3">{u.name}</td>
                  <td className="px-5 py-3 text-ink-muted">{u.email}</td>
                  <td className="px-5 py-3 text-ink-muted">{u.role}</td>
                  <td className="px-5 py-3">
                    {u.is_banned ? (
                      <span className="chip border-neon-red/40 text-neon-red">Banned</span>
                    ) : (
                      <span className="chip">Active</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {u.is_banned ? (
                      <ModerationButton action="unban" userId={u.id} label="Unban" />
                    ) : (
                      <ModerationButton action="ban" userId={u.id} label="Ban" tone="danger" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: number;
  color: "cyan" | "violet" | "amber";
}) {
  const styles = {
    cyan: "border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan",
    violet: "border-neon-violet/40 bg-neon-violet/10 text-neon-violet",
    amber: "border-neon-amber/40 bg-neon-amber/10 text-neon-amber",
  }[color];

  return (
    <div className="glass flex items-center gap-4 p-6">
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl border ${styles}`}>
        <Icon size={20} aria-hidden="true" />
      </span>
      <div>
        <p className="font-display text-2xl font-bold">{value.toLocaleString()}</p>
        <p className="text-xs text-ink-faint">{label}</p>
      </div>
    </div>
  );
}
