"use client";

import { useState } from "react";

export default function Home() {
  const [message, setMessage] = useState("");

  async function registerStress() {
    const response = await fetch("/api/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        emotion: "stress",
        timestamp: new Date().toISOString(),
      }),
    });

    const data = await response.json();

    if (data.success) {
      setMessage(`✅ Evento registrado: ${data.received.emotion}`);
    } else {
      setMessage("❌ Error al registrar el evento.");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-100">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">

        <h1 className="text-3xl font-bold text-center">
          Emotion Logger
        </h1>

        <p className="mt-2 text-center text-zinc-500">
          Registra un evento emocional.
        </p>

        <button
          onClick={registerStress}
          className="mt-8 w-full rounded-lg bg-red-500 py-4 text-lg font-semibold text-white transition hover:bg-red-600"
        >
          😓 Estoy estresado
        </button>

        {message && (
          <p className="mt-6 text-center text-green-600">
            {message}
          </p>
        )}

      </div>
    </main>
  );
}