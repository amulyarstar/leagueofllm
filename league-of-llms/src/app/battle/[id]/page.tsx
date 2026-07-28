"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { nanoid } from "nanoid";
import { ResponseCard } from "@/components/response-card";
import { VotingPanel } from "@/components/voting-panel";
import { WinnerBadge } from "@/components/winner-badge";
import { CATEGORY_CATALOG, type ModelName, type Slot, type VoteCategory } from "@/types";

interface ApiResponse {
  slot: Slot;
  text: string;
  latencyMs: number | null;
  tokens: number | null;
  error: string | null;
  modelName: ModelName | null;
}

export default function BattlePage() {
  const params = useParams<{ id: string }>();
  const [battle, setBattle] = useState<any>(null);
  const [responses, setResponses] = useState<ApiResponse[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [votes, setVotes] = useState<Partial<Record<VoteCategory, Slot>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const anonSessionId = useMemo(() => {
    if (typeof window === "undefined") return "";
    const existing = window.sessionStorage.getItem("lol_anon_id");
    if (existing) return existing;
    const id = nanoid();
    window.sessionStorage.setItem("lol_anon_id", id);
    return id;
  }, []);

  useEffect(() => {
    fetch(`/api/battle/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setBattle(data.battle);
          setResponses(data.responses);
          setRevealed(data.revealed);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load this battle.");
        setLoading(false);
      });
  }, [params.id]);

  async function handleSubmitVotes() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ battleId: params.id, votes, anonSessionId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not submit votes.");
        return;
      }
      setResponses((prev) => prev.map((r) => ({ ...r, modelName: data.modelSlots[r.slot] })));
      setRevealed(true);
    } catch {
      setError("Network error while submitting votes.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-ink-muted">Loading battle…</div>;
  if (error && !battle) return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-neon-red">{error}</div>;

  const category = CATEGORY_CATALOG.find((c) => c.id === battle.category);
  const overallWinner = responses.find((r) => votes.overall === r.slot)?.modelName;

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
      <div>
        <span className="chip">{category?.label ?? battle.category}</span>
        <p className="mt-3 text-lg text-ink">{battle.prompt}</p>
      </div>

      {revealed && overallWinner && <WinnerBadge modelName={overallWinner} />}

      <div className="grid gap-5 sm:grid-cols-2">
        {responses.map((r) => (
          <ResponseCard
            key={r.slot}
            slot={r.slot}
            text={r.text}
            error={r.error}
            latencyMs={r.latencyMs}
            tokens={r.tokens}
            revealed={revealed}
            modelName={r.modelName ?? undefined}
            isWinner={revealed && votes.overall === r.slot}
          />
        ))}
      </div>

      {error && <p className="text-sm text-neon-red">{error}</p>}

      {!revealed && (
        <VotingPanel
          availableSlots={responses.map((r) => r.slot)}
          votes={votes}
          onVote={(cat, slot) => setVotes((v) => ({ ...v, [cat]: slot }))}
          onSubmit={handleSubmitVotes}
          submitting={submitting}
        />
      )}
    </div>
  );
}
