import { supabase } from "@/lib/supabase";
import Link from "next/link";

const EMOTION_META: Record<string, { emoji: string; valence: string }> = {
  stress: { emoji: "😓", valence: "wine" },
  anxiety: { emoji: "😰", valence: "wine" },
  sad: { emoji: "😢", valence: "wine" },
  anger: { emoji: "😠", valence: "wine" },
  tired: { emoji: "🥱", valence: "mist" },
  calm: { emoji: "😌", valence: "sage" },
  happy: { emoji: "😄", valence: "sage" },
  energetic: { emoji: "⚡", valence: "sage" },
};

const VALENCE_COLOR: Record<string, string> = {
  wine: "var(--wine)",
  mist: "var(--mist)",
  sage: "var(--sage)",
};

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="font-data text-[10px] uppercase tracking-wide text-[var(--ink)]/40">
        {label}
      </span>
      <span className="font-data text-sm text-[var(--ink)]">{value}</span>
    </div>
  );
}

export default async function History() {
  const { data: summaries, error } = await supabase
    .from("daily_summary")
    .select("*")
    .order("day", { ascending: false })
    .limit(30);

  return (
    <main
      className="min-h-screen p-6 sm:p-10"
      style={{ backgroundColor: "var(--paper)" }}
    >
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 flex items-baseline justify-between">
          <h1 className="font-display text-4xl italic text-[var(--ink)]">Historial</h1>
          <Link
            href="/"
            className="font-data text-xs uppercase tracking-[0.15em] text-[var(--ink)]/45 hover:text-[var(--ink)]/70"
          >
            ← Volver
          </Link>
        </div>

        {error && (
          <p className="font-data text-sm text-[var(--wine)]">
            No se pudo cargar el historial: {error.message}
          </p>
        )}

        {summaries && summaries.length === 0 && (
          <p className="font-display italic text-[var(--ink)]/50">
            Aún no hay datos suficientes. Vuelve mañana.
          </p>
        )}

        <div className="divide-y divide-[var(--ink)]/10">
          {summaries?.map((row) => {
            const meta = row.dominant_emotion ? EMOTION_META[row.dominant_emotion] : null;
            const dateLabel = new Date(row.day).toLocaleDateString("es-CO", {
              weekday: "short",
              day: "numeric",
              month: "short",
            });

            return (
              <div
                key={row.day}
                className="flex flex-wrap items-center justify-between gap-4 py-5"
              >
                <div className="w-28 shrink-0">
                  <span className="font-display italic text-lg text-[var(--ink)]">
                    {dateLabel}
                  </span>
                </div>

                <div className="flex flex-1 flex-wrap gap-x-6 gap-y-2">
                  <Metric label="HR prom." value={row.hr_avg ? `${Math.round(row.hr_avg)}` : "—"} />
                  <Metric label="HR reposo" value={row.hr_resting ? `${Math.round(row.hr_resting)}` : "—"} />
                  <Metric label="HRV" value={row.hrv_avg ? row.hrv_avg.toFixed(1) : "—"} />
                  <Metric label="Pasos" value={row.total_steps ?? "—"} />
                  <Metric label="Sueño" value={row.sleep_hours ? `${row.sleep_hours}h` : "—"} />
                  <Metric label="Check-ins" value={String(row.checkin_count)} />
                </div>

                <div className="flex w-32 shrink-0 justify-end">
                  {meta ? (
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-data text-xs"
                      style={{
                        backgroundColor: `${VALENCE_COLOR[meta.valence]}1A`,
                        color: VALENCE_COLOR[meta.valence],
                      }}
                    >
                      {meta.emoji} {row.dominant_emotion}
                    </span>
                  ) : (
                    <span className="font-data text-xs text-[var(--ink)]/30">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}