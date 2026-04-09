"use client";

import { useState } from "react";
import { COMPETITORS } from "@/lib/constants";
import { DEFAULT_THEME } from "@/lib/themes";

interface User {
  id: string;
  name: string;
  isAdmin: boolean;
}

const t = DEFAULT_THEME;

export function LoginForm({ onLogin }: { onLogin: (user: User) => void }) {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [mode, setMode] = useState<"login" | "register">("register");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, pin }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }

    onLogin(data);
  };

  return (
    <div style={{ background: t.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>⛳</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: t.accent, margin: "0 0 6px" }}>
            Golf Majors 2026
          </h1>
          <p style={{ fontSize: 14, color: t.muted, margin: 0 }}>
            Pick your golfers. Track the scores. Win the pot.
          </p>
          <div style={{
            display: "inline-flex", marginTop: 10, fontSize: 12, fontWeight: 600,
            color: t.accent, background: t.accentLight, padding: "5px 14px",
            borderRadius: 20, border: `1px solid ${t.accentBorder}`,
          }}>
            6 players · 4 majors · £60 pot
          </div>
        </div>

        <form onSubmit={submit} style={{
          background: "#ffffff", border: `1px solid ${t.border}`,
          borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: t.text, margin: "0 0 20px" }}>
            {mode === "login" ? "Sign In" : "Register"}
          </h2>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, color: t.muted, marginBottom: 6, fontWeight: 500 }}>Name</label>
            <select value={name} onChange={(e) => setName(e.target.value)} style={{
              width: "100%", boxSizing: "border-box", background: "#fafafa",
              border: `1px solid ${t.border}`, borderRadius: 10, padding: "10px 12px",
              fontSize: 14, color: t.text, outline: "none", cursor: "pointer",
            }}>
              <option value="">Select your name</option>
              {COMPETITORS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 13, color: t.muted, marginBottom: 6, fontWeight: 500 }}>PIN</label>
            <input type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value)}
              placeholder={mode === "register" ? "Choose a PIN (4+ digits)" : "Enter your PIN"}
              style={{
                width: "100%", boxSizing: "border-box", background: "#fafafa",
                border: `1px solid ${t.border}`, borderRadius: 10, padding: "10px 12px",
                fontSize: 14, color: t.text, outline: "none",
              }}
            />
          </div>

          {error && (
            <div style={{
              fontSize: 13, marginBottom: 16, padding: "8px 12px", borderRadius: 8,
              background: "rgba(220,38,38,0.08)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.2)",
            }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading || !name || !pin} style={{
            width: "100%", padding: "12px", borderRadius: 12, border: "none",
            fontSize: 14, fontWeight: 700, cursor: loading ? "wait" : "pointer",
            background: t.accent, color: "#ffffff",
            opacity: loading || !name || !pin ? 0.4 : 1,
          }}>
            {loading ? "..." : mode === "login" ? "Sign In" : "Register"}
          </button>

          <button type="button"
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
            style={{
              width: "100%", textAlign: "center", fontSize: 13, color: t.accent,
              background: "none", border: "none", cursor: "pointer", marginTop: 12, padding: 4,
            }}
          >
            {mode === "login" ? "First time? Register here" : "Already registered? Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
