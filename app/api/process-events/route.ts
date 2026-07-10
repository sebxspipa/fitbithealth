import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getValidAccessToken, getHeartRateData } from "@/lib/googleHealth";

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

  let accessToken: string;
  try {
    accessToken = await getValidAccessToken();
  } catch (err) {
    console.error("Error obteniendo access token:", err);
    return NextResponse.json(
      { success: false, error: "No se pudo obtener el access token de Google Health" },
      { status: 500 }
    );
  }

  let processedCount = 0;

  for (const event of pendingEvents) {
    const startTime = event.timestamp;
    const endTime = new Date(
      new Date(event.timestamp).getTime() + 60 * 60 * 1000
    ).toISOString();

    try {
      const heartRateData = await getHeartRateData(accessToken, startTime, endTime);

      const samples = heartRateData.dataPoints ?? [];
      const heartRateAvg =
        samples.length > 0
          ? samples.reduce(
              (sum: number, point: any) => sum + (point.heartRate?.beatsPerMinute ?? 0),
              0
            ) / samples.length
          : null;

      const { error: insertError } = await supabase.from("fitbit_metrics").insert({
        event_id: event.id,
        heart_rate_avg: heartRateAvg,
        raw_response: heartRateData,
      });

      if (insertError) {
        console.error(`Error guardando métricas para evento ${event.id}:`, insertError);
        continue;
      }

      const { error: updateError } = await supabase
        .from("emotional_events")
        .update({ status: "completed" })
        .eq("id", event.id);

      if (updateError) {
        console.error(`Error actualizando evento ${event.id}:`, updateError);
        continue;
      }

      processedCount++;
    } catch (err) {
    console.error(`Error procesando evento ${event.id}:`, err);
    return NextResponse.json(
        {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        },
        { status: 500 }
    );
    }
  }

  return NextResponse.json({ success: true, processed: processedCount });
}