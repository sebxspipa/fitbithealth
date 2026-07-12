import { supabase } from "@/lib/supabase";
import Link from "next/link";

const EMOTION_EMOJIS: Record<string, string> = {
  stress: "😓",
  anxiety: "😰",
  calm: "😌",
  happy: "😄",
  sad: "😢",
  anger: "😠",
  energetic: "⚡",
  tired: "🥱",
};

export default async function History() {
  const { data: summaries, error } = await supabase
    .from("daily_summary")
    .select("*")
    .order("day", { ascending: false })
    .limit(30);

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-zinc-100">
        <p className="text-red-500">Error al cargar el historial: {error.message}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-100 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Historial</h1>
          <Link href="/" className="text-sm text-blue-500 hover:underline">
            ← Volver
          </Link>
        </div>

        <div className="overflow-x-auto rounded-xl bg-white shadow-lg">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50">
              <tr>
                <th className="px-4 py-3">Día</th>
                <th className="px-4 py-3">HR prom.</th>
                <th className="px-4 py-3">HR reposo</th>
                <th className="px-4 py-3">HRV</th>
                <th className="px-4 py-3">Pasos</th>
                <th className="px-4 py-3">Sueño</th>
                <th className="px-4 py-3">Check-ins</th>
                <th className="px-4 py-3">Emoción dominante</th>
              </tr>
            </thead>
            <tbody>
              {summaries?.map((row) => (
                <tr key={row.day} className="border-b border-zinc-100 last:border-0">
                  <td className="px-4 py-3 font-medium">
                    {new Date(row.day).toLocaleDateString("es-CO", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </td>
                  <td className="px-4 py-3">{row.hr_avg ? Math.round(row.hr_avg) : "—"}</td>
                  <td className="px-4 py-3">{row.hr_resting ? Math.round(row.hr_resting) : "—"}</td>
                  <td className="px-4 py-3">{row.hrv_avg ? row.hrv_avg.toFixed(1) : "—"}</td>
                  <td className="px-4 py-3">{row.total_steps ?? "—"}</td>
                  <td className="px-4 py-3">{row.sleep_hours ? `${row.sleep_hours}h` : "—"}</td>
                  <td className="px-4 py-3">{row.checkin_count}</td>
                  <td className="px-4 py-3">
                    {row.dominant_emotion ? (
                      <span>
                        {EMOTION_EMOJIS[row.dominant_emotion]} {row.dominant_emotion}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {summaries?.length === 0 && (
          <p className="mt-6 text-center text-zinc-500">
            Aún no hay datos suficientes. Vuelve mañana.
          </p>
        )}
      </div>
    </main>
  );
}