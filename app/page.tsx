"use client";

import { useState } from "react";
import Link from "next/link";

const EMOTIONS = [
  { value: "stress", label: "Estresado", emoji: "😓", valence: "wine" },
  { value: "anxiety", label: "Ansioso", emoji: "😰", valence: "wine" },
  { value: "sad", label: "Triste", emoji: "😢", valence: "wine" },
  { value: "anger", label: "Enojado", emoji: "😠", valence: "wine" },
  { value: "tired", label: "Cansado", emoji: "🥱", valence: "mist" },
  { value: "calm", label: "Tranquilo", emoji: "😌", valence: "sage" },
  { value: "happy", label: "Feliz", emoji: "😄", valence: "sage" },
  { value: "energetic", label: "Energético", emoji: "⚡", valence: "sage" },
] as const;

const VALENCE_COLOR: Record<string, string> = {
  wine: "var(--wine)",
  mist: "var(--mist)",
  sage: "var(--sage)",
};

const today = new Date().toLocaleDateString("es-CO", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export default function Home() {
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(3);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const selected = EMOTIONS.find((e) => e.value === selectedEmotion);

  async function registerCheckin() {
    if (!selectedEmotion) return;
    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emotion_type: selectedEmotion, intensity }),
      });
      const data = await response.json();

      if (data.success) {
        setMessage(`Registrado — ${selected?.label.toLowerCase()}, intensidad ${intensity}`);
        setSelectedEmotion(null);
        setIntensity(3);
      } else {
        setMessage(`No se pudo registrar: ${data.error}`);
      }
    } catch {
      setMessage("No se pudo registrar el día. Intenta de nuevo.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main
      className="relative flex min-h-screen items-center justify-center p-6"
      style={{
        backgroundImage:
          "linear-gradient(180deg, rgba(20,22,20,0.35) 0%, rgba(20,22,20,0.65) 100%), url('/images/hero-bg.jpg'), linear-gradient(160deg, #7e8c99 0%, #4b5a63 55%, #2b2a25 100%)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="w-full max-w-lg rounded-3xl border border-white/15 bg-[var(--cream)]/90 p-8 shadow-2xl backdrop-blur-md sm:p-10">
        <p className="font-data text-xs uppercase tracking-[0.2em] text-[var(--ink)]/50">
          Cierre del día · {today}
        </p>
        <h1 className="font-display mt-2 text-4xl italic leading-tight text-[var(--ink)] sm:text-5xl">
          ¿Cómo estuvo tu día?
        </h1>

        {/* Selector de emociones — pestañas serif con subrayado */}
        <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 border-b border-[var(--ink)]/10 pb-4">
          {EMOTIONS.map((emotion) => {
            const isSelected = selectedEmotion === emotion.value;
            return (
              <button
                key={emotion.value}
                onClick={() => setSelectedEmotion(emotion.value)}
                className={`font-display relative pb-2 text-base italic transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sage)] ${
                  isSelected ? "text-[var(--ink)]" : "text-[var(--ink)]/40 hover:text-[var(--ink)]/70"
                }`}
              >
                <span className="mr-1.5 not-italic">{emotion.emoji}</span>
                {emotion.label}
                {isSelected && (
                  <span
                    className="absolute -bottom-[17px] left-0 h-[2px] w-full rounded-full"
                    style={{ backgroundColor: VALENCE_COLOR[emotion.valence] }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Regla de intensidad, tipo instrumento */}
        {selectedEmotion && (
          <div className="mt-8">
            <p className="font-data text-xs uppercase tracking-[0.15em] text-[var(--ink)]/50">
              Intensidad
            </p>
            <div className="mt-4 flex items-end justify-between">
              {[1, 2, 3, 4, 5].map((level) => {
                const isActive = level <= intensity;
                return (
                  <button
                    key={level}
                    onClick={() => setIntensity(level)}
                    aria-label={`Intensidad ${level}`}
                    className="group flex flex-1 flex-col items-center gap-2 focus-visible:outline-none"
                  >
                    <span
                      className="w-full rounded-sm transition-all"
                      style={{
                        height: `${16 + level * 6}px`,
                        backgroundColor: isActive
                          ? VALENCE_COLOR[selected?.valence ?? "mist"]
                          : "rgba(43,42,37,0.12)",
                      }}
                    />
                    <span className="font-data text-[11px] text-[var(--ink)]/40 group-hover:text-[var(--ink)]/70">
                      {level}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-1 flex justify-between font-data text-[10px] uppercase tracking-wide text-[var(--ink)]/35">
              <span>Leve</span>
              <span>Intenso</span>
            </div>
          </div>
        )}

        <button
          onClick={registerCheckin}
          disabled={!selectedEmotion || isSaving}
          className="mt-10 w-full rounded-full bg-[var(--ink)] py-4 font-display text-lg italic text-[var(--cream)] transition hover:bg-[var(--ink)]/85 disabled:cursor-not-allowed disabled:bg-[var(--ink)]/25"
        >
          {isSaving ? "Guardando…" : "Cerrar el día"}
        </button>

        {message && (
          <p className="font-data mt-5 text-center text-xs text-[var(--ink)]/60">{message}</p>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/history"
            className="font-data text-xs uppercase tracking-[0.15em] text-[var(--ink)]/45 hover:text-[var(--ink)]/70"
          >
            Ver historial →
          </Link>
        </div>
      </div>
    </main>
  );
}