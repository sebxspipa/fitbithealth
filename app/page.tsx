"use client";

import { useState } from "react";
import Link from "next/link";

const EMOTIONS = [
  { value: "stress", label: "Estresado", emoji: "😓" },
  { value: "anxiety", label: "Ansioso", emoji: "😰" },
  { value: "calm", label: "Tranquilo", emoji: "😌" },
  { value: "happy", label: "Feliz", emoji: "😄" },
  { value: "sad", label: "Triste", emoji: "😢" },
  { value: "anger", label: "Enojado", emoji: "😠" },
  { value: "energetic", label: "Energético", emoji: "⚡" },
  { value: "tired", label: "Cansado", emoji: "🥱" },
];

export default function Home() {
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(3);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function registerCheckin() {
    if (!selectedEmotion) return;

    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emotion_type: selectedEmotion,
          intensity,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const emotionLabel = EMOTIONS.find((e) => e.value === selectedEmotion)?.label;
        setMessage(`✅ Registrado: ${emotionLabel} (intensidad ${intensity})`);
        setSelectedEmotion(null);
        setIntensity(3);
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      setMessage("❌ Error al registrar el evento.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-100">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <h1 className="text-3xl font-bold text-center">Emotion Logger</h1>
        <div className="text-center">
          <Link href="/history" className="text-sm text-blue-500 hover:underline">
            Ver historial →
          </Link>
        </div>
        <p className="mt-2 text-center text-zinc-500">
          ¿Cómo te sientes ahora?
        </p>

        <div className="mt-6 grid grid-cols-4 gap-2">
          {EMOTIONS.map((emotion) => (
            <button
              key={emotion.value}
              onClick={() => setSelectedEmotion(emotion.value)}
              className={`flex flex-col items-center justify-center rounded-lg border-2 p-3 transition ${
                selectedEmotion === emotion.value
                  ? "border-blue-500 bg-blue-50"
                  : "border-zinc-200 hover:border-zinc-300"
              }`}
            >
              <span className="text-2xl">{emotion.emoji}</span>
              <span className="mt-1 text-xs text-zinc-600">{emotion.label}</span>
            </button>
          ))}
        </div>

        {selectedEmotion && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-zinc-700">
              Intensidad: {intensity}
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              className="mt-2 w-full"
            />
            <div className="mt-1 flex justify-between text-xs text-zinc-400">
              <span>Leve</span>
              <span>Intenso</span>
            </div>
          </div>
        )}

        <button
          onClick={registerCheckin}
          disabled={!selectedEmotion || isSaving}
          className="mt-6 w-full rounded-lg bg-blue-500 py-4 text-lg font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          {isSaving ? "Guardando..." : "Registrar"}
        </button>

        {message && (
          <p className="mt-6 text-center text-green-600">{message}</p>
        )}
      </div>
    </main>
  );
}