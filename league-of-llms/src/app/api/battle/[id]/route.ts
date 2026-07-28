import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: battle, error } = await supabase.from("battles").select("*").eq("id", params.id).single();
  if (error || !battle) {
    return NextResponse.json({ error: "Battle not found." }, { status: 404 });
  }

  const { data: responses } = await supabase
    .from("responses")
    .select("slot, model_name, response_text, latency_ms, tokens, error")
    .eq("battle_id", params.id);

  const { count: voteCount } = await supabase
    .from("votes")
    .select("id", { count: "exact", head: true })
    .eq("battle_id", params.id);

  const revealed = (voteCount ?? 0) > 0;

  await supabase.from("battles").update({ view_count: battle.view_count + 1 }).eq("id", params.id);

  return NextResponse.json({
    battle: { ...battle, model_slots: revealed ? battle.model_slots : {} },
    responses: (responses ?? []).map((r) => ({
      slot: r.slot,
      text: r.response_text,
      latencyMs: r.latency_ms,
      tokens: r.tokens,
      error: r.error,
      modelName: revealed ? r.model_name : null,
    })),
    revealed,
    voteCount: voteCount ?? 0,
  });
}

const PatchSchema = z.object({ visibility: z.enum(["public", "private"]) });

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Sign in to publish a battle." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const service = createServiceClient();
  const { data: battle } = await service.from("battles").select("created_by").eq("id", params.id).single();
  if (!battle || battle.created_by !== user.id) {
    return NextResponse.json({ error: "You can only publish your own battles." }, { status: 403 });
  }

  const { error } = await service.from("battles").update({ visibility: parsed.data.visibility }).eq("id", params.id);
  if (error) return NextResponse.json({ error: "Could not update battle." }, { status: 500 });

  return NextResponse.json({ success: true });
}
