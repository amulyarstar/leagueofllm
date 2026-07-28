import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const ModerateSchema = z.object({
  action: z.enum(["remove", "restore", "ban", "unban"]),
  battleId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  reason: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "moderator"].includes(profile.role)) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const parsed = ModerateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const { action, battleId, userId, reason } = parsed.data;

  const service = createServiceClient();

  if ((action === "remove" || action === "restore") && battleId) {
    await service.from("battles").update({ status: action === "remove" ? "removed" : "completed" }).eq("id", battleId);
  }
  if ((action === "ban" || action === "unban") && userId) {
    await service.from("users").update({ is_banned: action === "ban" }).eq("id", userId);
  }

  await service.from("moderation_actions").insert({
    actor_id: user.id,
    target_battle_id: battleId ?? null,
    target_user_id: userId ?? null,
    action,
    reason: reason ?? null,
  });

  return NextResponse.json({ success: true });
}
