import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const VALID_EMOTIONS = [
  "stress",
  "anxiety",
  "calm",
  "happy",
  "sad",
  "anger",
  "energetic",
  "tired",
];

export async function POST(request: Request) {
  const body = await request.json();
  const { emotion_type, intensity, occurred_at, notes } = body;

  if (!emotion_type || !VALID_EMOTIONS.includes(emotion_type)) {
    return NextResponse.json(
      { success: false, error: `emotion_type inválido. Debe ser uno de: ${VALID_EMOTIONS.join(", ")}` },
      { status: 400 }
    );
  }

  if (intensity !== undefined && (intensity < 1 || intensity > 5)) {
    return NextResponse.json(
      { success: false, error: "intensity debe estar entre 1 y 5" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("emotional_checkins")
    .insert({
      emotion_type,
      intensity: intensity ?? null,
      occurred_at: occurred_at ?? new Date().toISOString(),
      notes: notes ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const { error: rpcError } = await supabase.rpc("compute_daily_summary", {
    target_day: new Date().toISOString().split("T")[0],
  });

  if (rpcError) {
    console.error("Error recalculando daily_summary tras check-in:", rpcError);
  }

  return NextResponse.json({ success: true, checkin: data });
}