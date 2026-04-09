"use client";

import { useState, useEffect, useCallback } from "react";
import { SLOTS } from "@/lib/constants";
import { DEFAULT_THEME, type TournamentTheme } from "@/lib/themes";

interface Golfer {
  id: string;
  name: string;
  espnId: string;
  region: string;
}

interface Pick {
  id: string;
  golferId: string;
  slot: string;
  golfer: { id: string; name: string; region: string };
  competitorId: string;
}

interface Tournament {
  id: string;
  name: string;
  year: number;
  deadline: string;
  locked: boolean;
  picks: Pick[];
}

const REGION_LABELS: Record<string, { label: string; emoji: string }> = {
  eu1: { label: "European #1", emoji: "🇪🇺" },
  eu2: { label: "European #2", emoji: "🇪🇺" },
  us: { label: "American", emoji: "🇺🇸" },
  row: { label: "Rest of World", emoji: "🌍" },
};

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
  const [golfers, setGolfers] = useState<Golfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  const loadData = useCallback(async () => {
    const [tRes, gRes] = await Promise.all([
      fetch("/api/tournaments"),
      fetch("/api/golfers"),
    ]);
    const tData = await tRes.json();
    const gData = await gRes.json();
    const t = (tData.tournaments || []).find((t: Tournament) => t.id === tournamentId);
    setTournament(t || null);
    setGolfers(gData.golfers || []);
    setLoading(false);

    if (t) {
      const myPicks = t.picks.filter((p: Pick) => p.competitorId === userId);
      const sel: Record<string, string> = {};
      myPicks.forEach((p: Pick) => { sel[p.slot] = p.golferId; });
      setSelections(sel);
    }
  }, [tournamentId, userId]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <div style={{ color: theme.dim, fontSize: 13 }}>Loading...</div>;

  if (!tournament) {
    return (
      <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 14, padding: "32px 20px", textAlign: "center" }}>
        <div style={{ color: theme.muted, fontSize: 14 }}>Tournament not found</div>
      </div>
    );
  }

  const isLocked = tournament.locked || new Date(tournament.deadline) <= new Date();
  const myPicks = tournament.picks.filter((p) => p.competitorId === userId);
  const hasPicks = myPicks.length === 4;

  // Golfer IDs used in other tournaments
  const usedGolferIds = new Set<string>();
  // We'd need all tournaments for this — fetch handled in the API validation

  const selectedInThisMajor = new Set(Object.values(selections));

  const getAvailableGolfers = (region: string, currentSlot: string) => {
    return golfers
      .filter((g) => g.region === region)
      .filter((g) => !selectedInThisMajor.has(g.id) || selections[currentSlot] === g.id)
      .filter((g) => !search || g.name.toLowerCase().includes(search.toLowerCase()));
  };

  const savePicks = async () => {
    setSaving(true);
    setMessage("");

    const picks = SLOTS.map((slot) => ({
      golferId: selections[slot.key],
      slot: slot.key,
    }));

    if (picks.some((p) => !p.golferId)) {
      setMessage("Fill all 4 slots before saving");
      setSaving(false);
      return;
    }

    const res = await fetch("/api/picks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tournamentId, picks }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setMessage(data.error);
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
          <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "rgba(248,113,113,0.12)", color: "#f87171", border: "1px solid rgba(248,113,113,0.3)", fontWeight: 600 }}>
            🔒 Locked
          </span>
        )}
      </div>

      {/* Deadline info */}
      {!isLocked && (
        <div style={{ fontSize: 12, color: theme.muted, marginBottom: 16, background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 10, padding: "10px 14px" }}>
          Deadline: {new Date(tournament.deadline).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
        </div>
      )}

      {/* Search */}
      {!isLocked && (
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search golfers..."
          style={{
            width: "100%",
            boxSizing: "border-box",
            background: theme.bgCard,
            border: `1px solid ${theme.border}`,
            borderRadius: 10,
            padding: "10px 14px",
            fontSize: 13,
            color: theme.text,
            marginBottom: 16,
            outline: "none",
          }}
        />
      )}

      {/* Locked state with existing picks */}
      {isLocked && hasPicks && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {SLOTS.map((slot) => {
            const pick = myPicks.find((p) => p.slot === slot.key);
            const info = REGION_LABELS[slot.key];
            return (
              <div key={slot.key} style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 12, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 11, color: theme.dim, marginBottom: 2 }}>{info.emoji} {info.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: theme.text }}>{pick?.golfer.name || "—"}</div>
                </div>
                <span style={{ fontSize: 11, color: theme.accent }}>✓</span>
              </div>
            );
          })}
        </div>
      )}

      {isLocked && !hasPicks && (
        <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 14, padding: "32px 20px", textAlign: "center" }}>
          <div style={{ color: theme.muted, fontSize: 14 }}>No picks submitted</div>
          <div style={{ color: theme.dim, fontSize: 12, marginTop: 4 }}>Picks are now locked for this major</div>
        </div>
      )}

      {/* Pick slots (editable) */}
      {!isLocked && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {SLOTS.map((slot) => {
              const selectedGolfer = golfers.find((g) => g.id === selections[slot.key]);
              const available = getAvailableGolfers(slot.region, slot.key);
              const info = REGION_LABELS[slot.key];

              return (
                <div key={slot.key} style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 12, padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>
                      {info.emoji} {info.label}
                    </div>
                    {selectedGolfer && (
                      <span style={{ fontSize: 12, color: theme.accent, fontWeight: 600 }}>{selectedGolfer.name}</span>
                    )}
                  </div>
                  <select
                    value={selections[slot.key] || ""}
                    onChange={(e) => setSelections({ ...selections, [slot.key]: e.target.value })}
                    style={{
                      width: "100%",
                      background: theme.bg,
                      border: `1px solid ${theme.border}`,
                      borderRadius: 8,
                      padding: "10px 12px",
                      fontSize: 13,
                      color: theme.text,
                      outline: "none",
                      cursor: "pointer",
                    }}
                  >
                    <option value="">Select a golfer...</option>
                    {available.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>

          {/* Save */}
          <div style={{ marginTop: 16 }}>
            {message && (
              <div style={{
                fontSize: 13,
                marginBottom: 10,
                padding: "8px 12px",
                borderRadius: 8,
                background: message.includes("saved") ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.12)",
                color: message.includes("saved") ? "#4ade80" : "#f87171",
                border: `1px solid ${message.includes("saved") ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}`,
              }}>
                {message}
              </div>
            )}
            <button
              onClick={savePicks}
              disabled={saving || Object.keys(selections).length < 4}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: 12,
                border: "none",
                fontSize: 14,
                fontWeight: 700,
                cursor: saving ? "wait" : "pointer",
                background: theme.accent,
                color: theme.bg,
                opacity: saving || Object.keys(selections).length < 4 ? 0.4 : 1,
              }}
            >
              {saving ? "Saving..." : "Save Picks"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
