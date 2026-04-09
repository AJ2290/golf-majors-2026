"use client";

import { useState, useEffect, useCallback } from "react";
import { DEFAULT_THEME, type TournamentTheme } from "@/lib/themes";

interface Pick {
  slot: string;
  golfer: { name: string };
  competitorId: string;
}

interface Tournament {
  id: string;
  name: string;
  deadline: string;
  locked: boolean;
  picks: Pick[];
}

const SLOTS = [
  { key: "eu1", label: "European #1", emoji: "🇪🇺", placeholder: "e.g. Rory McIlroy" },
  { key: "eu2", label: "European #2", emoji: "🇪🇺", placeholder: "e.g. Viktor Hovland" },
  { key: "us", label: "American", emoji: "🇺🇸", placeholder: "e.g. Scottie Scheffler" },
  { key: "row", label: "Rest of World", emoji: "🌍", placeholder: "e.g. Min Woo Lee" },
];

export function PickTeam({
  userId,
  tournamentId,
  theme = DEFAULT_THEME,
}: {
  userId: string;
  tournamentId: string;
  theme?: TournamentTheme;
}) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [picks, setPicks] = useState<Record<string, string>>({ eu1: "", eu2: "", us: "", row: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadData = useCallback(async () => {
    const res = await fetch("/api/tournaments");
    const data = await res.json();
    const t = (data.tournaments || []).find((t: Tournament) => t.id === tournamentId);
    setTournament(t || null);
    setLoading(false);

    if (t) {
      const myPicks = t.picks.filter((p: Pick) => p.competitorId === userId);
      const sel: Record<string, string> = { eu1: "", eu2: "", us: "", row: "" };
      myPicks.forEach((p: Pick) => { sel[p.slot] = p.golfer.name; });
      setPicks(sel);
    }
  }, [tournamentId, userId]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <div style={{ color: theme.dim, fontSize: 13 }}>Loading...</div>;
  if (!tournament) return null;

  const isLocked = tournament.locked || new Date(tournament.deadline) <= new Date();
  const hasPicks = Object.values(picks).every((v) => v.trim() !== "");

  const savePicks = async () => {
    setSaving(true);
    setMessage("");

    const entries = SLOTS.map((slot) => ({
      slot: slot.key,
      golferName: picks[slot.key]?.trim(),
    }));

    if (entries.some((e) => !e.golferName)) {
      setMessage("Fill in all 4 golfers before saving");
      setSaving(false);
      return;
    }

    const res = await fetch("/api/picks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tournamentId, picks: entries }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setMessage(data.error || "Something went wrong");
      return;
    }

    setMessage("Picks saved!");
    loadData();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: theme.text, margin: 0 }}>My Picks</h2>
        {isLocked && (
          <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 20, background: "rgba(248,113,113,0.12)", color: "#f87171", border: "1px solid rgba(248,113,113,0.3)", fontWeight: 600 }}>
            🔒 Picks Locked
          </span>
        )}
        {!isLocked && hasPicks && (
          <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 20, background: "rgba(74,222,128,0.12)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.3)", fontWeight: 600 }}>
            ✓ Submitted
          </span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {SLOTS.map((slot) => (
          <div key={slot.key} style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: theme.text, marginBottom: 8 }}>
              {slot.emoji} {slot.label}
            </div>
            {isLocked ? (
              <div style={{ fontSize: 15, fontWeight: 600, color: picks[slot.key] ? theme.accent : theme.dim }}>
                {picks[slot.key] || "No pick"}
              </div>
            ) : (
              <input
                type="text"
                value={picks[slot.key]}
                onChange={(e) => setPicks({ ...picks, [slot.key]: e.target.value })}
                placeholder={slot.placeholder}
                style={{
                  width: "100%", boxSizing: "border-box",
                  background: theme.bg, border: `1px solid ${theme.border}`,
                  borderRadius: 8, padding: "10px 12px", fontSize: 14,
                  color: theme.text, outline: "none",
                }}
              />
            )}
          </div>
        ))}
      </div>

      {!isLocked && (
        <div style={{ marginTop: 16 }}>
          {message && (
            <div style={{
              fontSize: 13, marginBottom: 10, padding: "8px 12px", borderRadius: 8,
              background: message.includes("saved") ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.12)",
              color: message.includes("saved") ? "#4ade80" : "#f87171",
              border: `1px solid ${message.includes("saved") ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}`,
            }}>
              {message}
            </div>
          )}
          <button onClick={savePicks} disabled={saving} style={{
            width: "100%", padding: "14px", borderRadius: 12, border: "none",
            fontSize: 14, fontWeight: 700, cursor: saving ? "wait" : "pointer",
            background: theme.accent, color: theme.bg, opacity: saving ? 0.5 : 1,
          }}>
            {saving ? "Saving..." : hasPicks ? "Update Picks" : "Save Picks"}
          </button>
        </div>
      )}
    </div>
  );
}
