import { NextResponse } from "next/server";
import { syncMetric, syncSleep } from "@/lib/googleHealth";

const METRICS_TO_SYNC = ["heart_rate", "hrv"];

export async function POST() {
  const results: Record<string, any> = {};

  for (const metricKey of METRICS_TO_SYNC) {
    try {
      const result = await syncMetric(metricKey);
      results[metricKey] = { success: true, ...result };
    } catch (err) {
      console.error(`Error sincronizando ${metricKey}:`, err);
      results[metricKey] = {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  try {
    const sleepResult = await syncSleep();
    results.sleep = { success: true, ...sleepResult };
  } catch (err) {
    console.error("Error sincronizando sleep:", err);
    results.sleep = {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  return NextResponse.json({ success: true, results });
}