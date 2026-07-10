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
  const bufferMs = 5 * 60 * 1000; // renovamos 5 min antes de que expire

  if (now < expiresAt - bufferMs) {
    return tokenRow.access_token;
  }

  // Token expirado o por expirar: renovamos
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

export async function getHeartRateData(accessToken: string, startTime: string, endTime: string) {
  const filter = `heart_rate.sample_time.physical_time >= "${startTime}" AND heart_rate.sample_time.physical_time < "${endTime}"`;

  const url = `https://health.googleapis.com/v4/users/me/dataTypes/heart-rate/dataPoints?filter=${encodeURIComponent(filter)}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Error consultando heart rate:", data);
    throw new Error(`Fallo la consulta de heart rate a Google Health: ${JSON.stringify(data)}`);
  }

  return data;
}