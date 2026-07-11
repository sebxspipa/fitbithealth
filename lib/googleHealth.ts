import { supabase } from "./supabase";

export async function getValidAccessToken(): Promise<string> {
  const { data: tokenRow, error } = await supabase
    .from("fitbit_tokens")
    .select("*")
    .eq("id", 1)
    .single();

  if (error || !tokenRow) {
    throw new Error("No hay token de Google Health guardado. Autoriza primero en /api/fitbit/authorize");
  }

  const expiresAt = new Date(tokenRow.expires_at).getTime();
  const now = Date.now();
  const bufferMs = 5 * 60 * 1000;

  if (now < expiresAt - bufferMs) {
    return tokenRow.access_token;
  }

  const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: tokenRow.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  const refreshData = await refreshResponse.json();

  if (!refreshResponse.ok) {
    console.error("Error al renovar token:", refreshData);
    throw new Error("No se pudo renovar el access token de Google Health");
  }

  const newExpiresAt = new Date(Date.now() + refreshData.expires_in * 1000).toISOString();

  await supabase
    .from("fitbit_tokens")
    .update({
      access_token: refreshData.access_token,
      expires_at: newExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  return refreshData.access_token;
}

type MetricConfig = {
  dataType: string;
  metricType: string;
  unit: string;
  extractValue: (point: any) => number;
  extractSampleTime: (point: any) => string | undefined;
};

const METRIC_CONFIGS: Record<string, MetricConfig> = {
  heart_rate: {
    dataType: "heart-rate",
    metricType: "heart_rate",
    unit: "bpm",
    extractValue: (point) => Number(point.heartRate?.beatsPerMinute ?? 0),
    extractSampleTime: (point) => point.heartRate?.sampleTime?.physicalTime,
  },
  // steps: pendiente — el endpoint list() no devuelve conteos para "steps",
  // requiere el endpoint :rollUp con una lógica distinta. Ver syncStepsRollup() (futuro).
};

async function fetchDataPoints(
  accessToken: string,
  dataType: string,
  filterField: string,
  startTime: string,
  endTime: string
): Promise<any[]> {
  const filter = `${filterField} >= "${startTime}" AND ${filterField} < "${endTime}"`;

  let allDataPoints: any[] = [];
  let pageToken: string | undefined = undefined;

  do {
    const params = new URLSearchParams({ filter });
    if (pageToken) {
      params.set("pageToken", pageToken);
    }

    const url = `https://health.googleapis.com/v4/users/me/dataTypes/${dataType}/dataPoints?${params.toString()}`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`Error consultando ${dataType}:`, data);
      throw new Error(`Fallo la consulta de ${dataType} a Google Health: ${JSON.stringify(data)}`);
    }

    allDataPoints = allDataPoints.concat(data.dataPoints ?? []);
    pageToken = data.nextPageToken;

    if (pageToken) {
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  } while (pageToken);

  return allDataPoints;
}

export async function syncMetric(metricKey: string): Promise<{ synced: number }> {
  const config = METRIC_CONFIGS[metricKey];
  if (!config) {
    throw new Error(`Métrica desconocida o no soportada aún: ${metricKey}`);
  }

  const accessToken = await getValidAccessToken();

  const { data: syncRow } = await supabase
    .from("sync_state")
    .select("*")
    .eq("data_type", metricKey)
    .maybeSingle();

  const startTime = syncRow?.last_synced_at ?? new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const endTime = new Date().toISOString();

  const filterField =
    config.dataType === "heart-rate" ? "heart_rate.sample_time.physical_time" : `${config.dataType}.sample_time.physical_time`;

  const dataPoints = await fetchDataPoints(accessToken, config.dataType, filterField, startTime, endTime);

    if (dataPoints.length === 0) {
    await supabase.from("sync_state").upsert({
        data_type: metricKey,
        last_synced_at: endTime,
        updated_at: new Date().toISOString(),
    });
    console.log(`Sync ${metricKey}: 0 puntos. Ventana consultada: ${startTime} → ${endTime}`);
    return { synced: 0 };
    }

  const rows = dataPoints
    .map((point) => ({
      metric_type: config.metricType,
      value: config.extractValue(point),
      unit: config.unit,
      sample_time: config.extractSampleTime(point),
      source_device: point.dataSource?.platform ?? null,
    }))
    .filter((row) => row.sample_time);

  const { error: insertError } = await supabase
    .from("physiological_samples")
    .upsert(rows, { onConflict: "metric_type,sample_time,source_device", ignoreDuplicates: true });

  if (insertError) {
    console.error(`Error guardando muestras de ${metricKey}:`, insertError);
    throw insertError;
  }

  await supabase.from("sync_state").upsert({
    data_type: metricKey,
    last_synced_at: endTime,
    updated_at: new Date().toISOString(),
  });

  return { synced: rows.length };
}