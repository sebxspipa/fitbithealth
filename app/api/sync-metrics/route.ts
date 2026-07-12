import { NextResponse } from "next/server";
import { syncMetric, syncSleep, syncSteps } from "@/lib/googleHealth";

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

  try {
    const stepsResult = await syncSteps();
    results.steps = { success: true, ...stepsResult };
  } catch (err) {
    console.error("Error sincronizando steps:", err);
    results.steps = {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  return NextResponse.json({ success: true, results });
}