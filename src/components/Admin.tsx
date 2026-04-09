"use client";

import { useState, useEffect, useCallback } from "react";
import { DEFAULT_THEME } from "@/lib/themes";

const theme = DEFAULT_THEME;

interface Tournament {
  id: string;
  name: string;
  year: number;
  deadline: string;
  locked: boolean;
  espnId: string | null;
}

export function Admin() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const loadTournaments = useCallback(async () => {
    const res = await fetch("/api/tournaments");
    const data = await res.json();
    setTournaments(data.tournaments || []);
  }, []);

  useEffect(() => { loadTournaments(); }, [loadTournaments]);

  const setup = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/setup", { method: "POST" });
    const data = await res.json();
    setMessage(`Created: ${data.created?.join(", ") || "none (already exist)"}`);
    setLoading(false);
    loadTournaments();
  };

  const syncField = async (espnId: string) => {
    if (!espnId) { setMessage("Set ESPN event ID first"); return; }
    setLoading(true);
    const res = await fetch("/api/admin/sync-field", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ espnEventId: espnId }),
    });
    const data = await res.json();
    setMessage(`Synced field: ${data.created} created, ${data.updated} updated (${data.total} total)`);
    setLoading(false);
  };

  const syncScores = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/sync-scores", { method: "POST" });
    const data = await res.json();
    setMessage(`Synced ${data.synced} scores`);
    setLoading(false);
  };

  const updateTournament = async (id: string, field: string, value: string | boolean) => {
    await fetch("/api/admin/tournament", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tournamentId: id, [field]: value }),
    });
    loadTournaments();
  };

  const inputStyle = {
    background: theme.bg,
    border: `1px solid ${theme.border}`,
    borderRadius: 8,
    padding: "8px 10px",
    fontSize: 13,
    color: theme.text,
    outline: "none",
  };

  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: theme.text, margin: "0 0 16px" }}>Admin</h2>

      {message && (
        <div style={{
          background: "rgba(74,222,128,0.12)",
          border: "1px solid rgba(74,222,128,0.3)",
          borderRadius: 10,
          padding: "10px 14px",
          marginBottom: 16,
          fontSize: 13,
          color: "#4ade80",
        }}>
          {message}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <button
          onClick={setup}
          disabled={loading}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            background: "#3b82f6",
            color: "white",
            opacity: loading ? 0.5 : 1,
          }}
        >
          Setup Tournaments
        </button>
        <button
          onClick={syncScores}
          disabled={loading}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            background: "#8b5cf6",
            color: "white",
            opacity: loading ? 0.5 : 1,
          }}
        >
          Sync All Scores
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {tournaments.map((t) => (
          <div key={t.id} style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: theme.text, margin: 0 }}>{t.name}</h3>
              <span style={{
                fontSize: 11,
                padding: "3px 10px",
                borderRadius: 20,
                fontWeight: 600,
                background: t.locked ? "rgba(248,113,113,0.12)" : "rgba(74,222,128,0.12)",
                color: t.locked ? "#f87171" : "#4ade80",
                border: `1px solid ${t.locked ? "rgba(248,113,113,0.3)" : "rgba(74,222,128,0.3)"}`,
              }}>
                {t.locked ? "Locked" : "Open"}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, color: theme.dim, marginBottom: 4 }}>ESPN Event ID</label>
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    type="text"
                    defaultValue={t.espnId || ""}
                    onBlur={(e) => updateTournament(t.id, "espnId", e.target.value)}
                    placeholder="e.g. 401580329"
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <button
                    onClick={() => syncField(t.espnId || "")}
                    disabled={!t.espnId || loading}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 6,
                      border: `1px solid ${theme.border}`,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                      background: theme.bgCard,
                      color: theme.muted,
                      opacity: !t.espnId || loading ? 0.4 : 1,
                    }}
                  >
                    Sync
                  </button>
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, color: theme.dim, marginBottom: 4 }}>Deadline</label>
                <input
                  type="datetime-local"
                  defaultValue={t.deadline ? new Date(t.deadline).toISOString().slice(0, 16) : ""}
                  onBlur={(e) => updateTournament(t.id, "deadline", e.target.value)}
                  style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
                />
              </div>
            </div>

            <button
              onClick={() => updateTournament(t.id, "locked", !t.locked)}
              style={{
                padding: "6px 14px",
                borderRadius: 6,
                border: "none",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                background: t.locked ? "rgba(74,222,128,0.15)" : "rgba(248,113,113,0.15)",
                color: t.locked ? "#4ade80" : "#f87171",
              }}
            >
              {t.locked ? "Unlock" : "Lock Now"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
