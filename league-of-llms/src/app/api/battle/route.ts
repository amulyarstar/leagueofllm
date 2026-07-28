import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { callAllModels } from "@/lib/models/providers";
import { shuffle } from "@/lib/utils";
import type { ModelName, Slot } from "@/types";

const SLOTS: Slot[] = ["A", "B", "C", "D"];

const CreateBattleSchema = z.object({
  prompt: z.string().min(3).max(4000),
  category: z.enum(["coding", "writing", "business", "research", "marketing", "education", "creativity"]),
  models: z
    .array(z.enum(["gpt", "claude", "gemini", "deepseek", "grok", "mistral"]))
    .min(2)
    .max(4),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = CreateBattleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request.", details: parsed.error.flatten() }, { status: 400 });
  }
  const { prompt, category, models } = parsed.data;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const shuffledModels = shuffle(models as ModelName[]);
  const modelSlots: Partial<Record<Slot, ModelName>> = {};
  shuffledModels.forEach((model, i) => {
    modelSlots[SLOTS[i]] = model;
  });

  const service = createServiceClient();

  const { data: battle, error: battleError } = await service
    .from("battles")
    .insert({
      prompt,
      category,
      created_by: user?.id ?? null,
      status: "running",
      model_slots: modelSlots,
    })
    .select()
    .single();

  if (battleError || !battle) {
    return NextResponse.json({ error: "Could not create battle." }, { status: 500 });
  }

  try {
    const results = await callAllModels(shuffledModels, prompt);

    const responseRows = shuffledModels.map((model, i) => ({
      battle_id: battle.id,
      model_name: model,
      slot: SLOTS[i],
      response_text: results[model].text,
      latency_ms: results[model].latencyMs,
      tokens: results[model].tokens,
      error: results[model].error,
    }));

    const { error: insertError } = await service.from("responses").insert(responseRows);
    if (insertError) throw insertError;

    await service.from("battles").update({ status: "completed" }).eq("id", battle.id);

    // Strip model_name from the payload — identities stay hidden until voting completes.
    const publicResponses = responseRows.map(({ slot, response_text, latency_ms, tokens, error }) => ({
      slot,
      text: response_text,
      latencyMs: latency_ms,
      tokens,
      error,
    }));

    return NextResponse.json({ battleId: battle.id, responses: publicResponses }, { status: 201 });
  } catch (err) {
    await service.from("battles").update({ status: "flagged", flagged_reason: "generation_failed" }).eq("id", battle.id);
    return NextResponse.json(
      { error: "One or more models failed to respond. Please try again." },
      { status: 502 }
    );
  }
}
