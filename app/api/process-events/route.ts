import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { data: pendingEvents, error: fetchError } = await supabase
    .from("emotional_events")
    .select("*")
    .eq("status", "pending")
    .lte("timestamp", oneHourAgo);

  if (fetchError) {
    console.error(fetchError);
    return NextResponse.json(
      { success: false, error: fetchError.message },
      { status: 500 }
    );
  }

  if (!pendingEvents || pendingEvents.length === 0) {
    return NextResponse.json({ success: true, processed: 0 });
  }

  for (const event of pendingEvents) {
    // TODO: aquí irá la llamada a la Fitbit Web API (Opción A)
    console.log(`Procesando evento ${event.id} (${event.emotion})`);

    const { error: updateError } = await supabase
      .from("emotional_events")
      .update({ status: "completed" })
      .eq("id", event.id);

    if (updateError) {
      console.error(`Error actualizando evento ${event.id}:`, updateError);
    }
  }

  return NextResponse.json({ success: true, processed: pendingEvents.length });
}