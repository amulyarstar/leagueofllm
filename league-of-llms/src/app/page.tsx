"use client";

import { useMemo, useState } from "react";
import { nanoid } from "nanoid";
import { Hero } from "@/components/hero";
import { PromptInput } from "@/components/prompt-input";
import { ModelSelector } from "@/components/model-selector";
import { CategoryTabs } from "@/components/category-tabs";
import { ResponseCard } from "@/components/response-card";
import { VotingPanel } from "@/components/voting-panel";
import { WinnerBadge } from "@/components/winner-badge";
import { useBattleStore } from "@/store/battle-store";
import { useAuth } from "@/hooks/use-auth";
import type { ModelName, Slot } from "@/types";
import { RotateCcw, Share2 } from "lucide-react";

const SLOTS: Slot[] = ["A", "B", "C", "D"];

interface SlotState {
  slot: Slot;
  text: string;
  latencyMs: number | null;
  tokens: number | null;
  error: string | null;
  modelName?: ModelName;
}

type Phase = "setup" | "battling" | "voting" | "revealed";

export default function HomePage() {
  const { prompt, category, selectedModels, votes, setPrompt, setCategory, toggleModel, castVote, reset } =
    useBattleStore();
  const { user } = useAuth();

  const [phase, setPhase] = useState<Phase>("setup");
  const [battleId, setBattleId] = useState<string | null>(null);
  const [slotData, setSlotData] = useState<SlotState[]>([]);
  const [submittingVotes, setSubmittingVotes] = useState(false);
  const [publishState, setPublishState] = useState<"idle" | "publishing" | "published">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const anonSessionId = useMemo(() => {
    if (typeof window === "undefined") return "";
    const existing = window.sessionStorage.getItem("lol_anon_id");
    if (existing) return existing;
    const id = nanoid();
    window.sessionStorage.setItem("lol_anon_id", id);
    return id;
  }, []);

  const activeSlots = SLOTS.slice(0, selectedModels.length);

  async function handleBattle() {
    setErrorMsg(null);
    setPhase("battling");
    setSlotData(activeSlots.map((slot) => ({ slot, text: "", latencyMs: null, tokens: null, error: null })));

    try {
      const res = await fetch("/api/battle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, category, models: selectedModels }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error ?? "Something went wrong starting the battle.");
        setPhase("setup");
        return;
      }

      setBattleId(data.battleId);
      setSlotData(
        data.responses.map((r: any) => ({
          slot: r.slot,
          text: r.text,
          latencyMs: r.latencyMs,
          tokens: r.tokens,
          error: r.error,
        }))
      );
      setPhase("voting");
    } catch {
      setErrorMsg("Network error — please check your connection and try again.");
      setPhase("setup");
    }
  }

  async function handleSubmitVotes() {
    if (!battleId) return;
    setSubmittingVotes(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ battleId, votes, anonSessionId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error ?? "Could not submit votes.");
        setSubmittingVotes(false);
        return;
      }

      setSlotData((prev) => prev.map((s) => ({ ...s, modelName: data.modelSlots[s.slot] })));
      setPhase("revealed");
    } catch {
      setErrorMsg("Network error while submitting votes.");
    } finally {
      setSubmittingVotes(false);
    }
  }

  async function handlePublish() {
    if (!battleId) return;
    setPublishState("publishing");
    const res = await fetch(`/api/battle/${battleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visibility: "public" }),
    });
    setPublishState(res.ok ? "published" : "idle");
  }

  function handleReset() {
    reset();
    setPhase("setup");
    setBattleId(null);
    setSlotData([]);
    setPublishState("idle");
    setErrorMsg(null);
  }

  const overallWinnerModel = slotData.find((s) => s.slot === votes.overall)?.modelName;

  return (
    <div className="pb-24">
      {phase === "setup" && <Hero />}

      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {phase === "setup" && (
          <div className="glass animate-rise space-y-6 p-6 sm:p-8">
            <CategoryTabs value={category} onChange={setCategory} />
            <PromptInput value={prompt} onChange={setPrompt} onSubmit={handleBattle} />
            <ModelSelector selected={selectedModels} onToggle={toggleModel} />
            {errorMsg && <p className="text-sm text-neon-red">{errorMsg}</p>}
          </div>
        )}

        {phase !== "setup" && (
          <div className="space-y-8 pt-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-ink-faint">Prompt</p>
                <p className="mt-1 max-w-2xl text-sm text-ink-muted">{prompt}</p>
              </div>
              <button onClick={handleReset} className="btn-secondary shrink-0 !px-4 !py-2 text-xs">
                <RotateCcw size={14} aria-hidden="true" /> New battle
              </button>
            </div>

            {phase === "revealed" && overallWinnerModel && <WinnerBadge modelName={overallWinnerModel} />}

            <div className="grid gap-5 sm:grid-cols-2">
              {slotData.map((s) => (
                <ResponseCard
                  key={s.slot}
                  slot={s.slot}
                  text={s.text}
                  loading={phase === "battling"}
                  error={s.error}
                  latencyMs={s.latencyMs}
                  tokens={s.tokens}
                  revealed={phase === "revealed"}
                  modelName={s.modelName}
                  isWinner={phase === "revealed" && votes.overall === s.slot}
                />
              ))}
            </div>

            {errorMsg && <p className="text-sm text-neon-red">{errorMsg}</p>}

            {phase === "voting" && (
              <VotingPanel
                availableSlots={activeSlots}
                votes={votes}
                onVote={castVote}
                onSubmit={handleSubmitVotes}
                submitting={submittingVotes}
              />
            )}

            {phase === "revealed" && (
              <div className="glass flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:justify-between sm:text-left">
                <div>
                  <p className="font-semibold">Share this battle</p>
                  <p className="text-sm text-ink-muted">
                    {user ? "Publish it to the public feed for the community to vote on." : "Sign in to publish battles to the public feed."}
                  </p>
                </div>
                <button
                  onClick={handlePublish}
                  disabled={!user || publishState !== "idle"}
                  className="btn-primary shrink-0"
                >
                  <Share2 size={16} aria-hidden="true" />
                  {publishState === "published" ? "Published!" : publishState === "publishing" ? "Publishing…" : "Publish battle"}
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
