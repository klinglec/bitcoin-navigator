"use client";

import { useState, FormEvent } from "react";

interface Props {
  source?: string;
  size?: "large" | "default";
}

export default function EmailCapture({ source = "landing", size = "default" }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === "loading" || status === "success") return;

    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Etwas ist schiefgelaufen.");
      } else {
        setStatus("success");
        setMessage(data.message ?? "Du bist dabei. Wir melden uns.");
        setEmail("");
      }
    } catch {
      setStatus("error");
      setMessage("Etwas ist schiefgelaufen. Bitte versuche es erneut.");
    }
  }

  const isLarge = size === "large";

  if (status === "success") {
    return (
      <div
        className="flex items-center gap-3 rounded-lg px-5 py-4 border"
        style={{ borderColor: "var(--accent)", background: "var(--accent-dim)" }}
      >
        <span style={{ color: "var(--accent)" }} className="text-xl">✓</span>
        <p style={{ color: "var(--accent)" }} className="font-semibold text-sm tracking-wide">
          {message}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className={`flex flex-col sm:flex-row gap-3 ${isLarge ? "max-w-xl" : "max-w-lg"}`}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="deine@email.de"
          required
          className={`flex-1 rounded-lg border px-4 outline-none transition-all duration-200 font-mono text-sm placeholder-[#555] ${
            isLarge ? "py-4 text-base" : "py-3"
          }`}
          style={{
            background: "var(--surface)",
            borderColor: status === "error" ? "#ef4444" : "var(--border)",
            color: "var(--text-primary)",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.target.style.borderColor = status === "error" ? "#ef4444" : "var(--border)")}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className={`rounded-lg font-bold tracking-wide transition-all duration-200 whitespace-nowrap ${
            isLarge ? "px-8 py-4 text-base" : "px-6 py-3 text-sm"
          }`}
          style={{
            background: status === "loading" ? "var(--accent-dim)" : "var(--accent)",
            color: status === "loading" ? "var(--accent)" : "#0a0a0a",
            cursor: status === "loading" ? "not-allowed" : "pointer",
          }}
          onMouseEnter={(e) => {
            if (status !== "loading") {
              (e.target as HTMLButtonElement).style.background = "#e8841a";
            }
          }}
          onMouseLeave={(e) => {
            if (status !== "loading") {
              (e.target as HTMLButtonElement).style.background = "var(--accent)";
            }
          }}
        >
          {status === "loading" ? "…" : "Beim Launch benachrichtigen"}
        </button>
      </div>
      {status === "error" && (
        <p className="mt-2 text-sm" style={{ color: "#ef4444" }}>
          {message}
        </p>
      )}
    </form>
  );
}
