import { NextResponse } from "next/server";
import { syncMetric } from "@/lib/googleHealth";
import { supabase } from "@/lib/supabase";

const METRICS_TO_SYNC = ["heart_rate"];

export async function POST() {
  const results: Record<string, any> = {};

  for (const metricKey of METRICS_TO_SYNC) {
    try {
      const result = await syncMetric(metricKey);
      const { data: syncRow } = await supabase
        .from("sync_state")
        .select("*")
        .eq("data_type", metricKey)
        .maybeSingle();
      results[metricKey] = { success: true, ...result, sync_state: syncRow };
    } catch (err) {
      console.error(`Error sincronizando ${metricKey}:`, err);
      results[metricKey] = {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  return NextResponse.json({ success: true, results });
}