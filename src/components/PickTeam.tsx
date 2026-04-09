"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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

interface Suggestion {
  id: string;
  name: string;
  region: string;
}

const SLOTS = [
  { key: "eu1", label: "European #1", emoji: "\u{1F1EA}\u{1F1FA}", placeholder: "e.g. Rory McIlroy", region: "EU" },
  { key: "eu2", label: "European #2", emoji: "\u{1F1EA}\u{1F1FA}", placeholder: "e.g. Viktor Hovland", region: "EU" },
  { key: "us", label: "American", emoji: "\u{1F1FA}\u{1F1F8}", placeholder: "e.g. Scottie Scheffler", region: "US" },
  { key: "row", label: "Rest of World", emoji: "\u{1F30D}", placeholder: "e.g. Min Woo Lee", region: "ROW" },
];

function GolferInput({
  slot,
  value,
  onChange,
  disabled,
  theme,
  error,
}: {
  slot: typeof SLOTS[0];
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  theme: TournamentTheme;
  error?: string;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchSuggestions = (q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) { setSuggestions([]); return; }

    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/golfers/search?q=${encodeURIComponent(q)}&region=${slot.region}`);
      const data = await res.json();
      setSuggestions(data.results || []);
      setShowSuggestions(true);
    }, 200);
  };

  const selectSuggestion = (name: string) => {
    onChange(name);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  if (disabled) {
    return (
      <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 12, padding: "14px 16px" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: theme.muted, marginBottom: 4 }}>
          {slot.emoji} {slot.label}
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, color: value ? theme.accent : theme.dim }}>
          {value || "No pick"}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: theme.bgCard,
      border: `1px solid ${error ? "rgba(220,38,38,0.4)" : theme.border}`,
      borderRadius: 12, padding: "14px 16px", position: "relative",
    }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: theme.text, marginBottom: 8 }}>
        {slot.emoji} {slot.label}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => { onChange(e.target.value); fetchSuggestions(e.target.value); }}
        onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        placeholder={slot.placeholder}
        style={{
          width: "100%", boxSizing: "border-box",
          background: "#ffffff", border: `1px solid ${theme.border}`,
          borderRadius: 8, padding: "10px 12px", fontSize: 14,
          color: theme.text, outline: "none",
        }}
      />
      {/* Autocomplete suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div style={{
          position: "absolute", left: 16, right: 16, top: "100%", zIndex: 10,
          background: "#ffffff", border: `1px solid ${theme.border}`,
          borderRadius: 8, marginTop: -4, boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          overflow: "hidden",
        }}>
          {suggestions.map((s) => (
            <button
              key={s.id}
              onMouseDown={() => selectSuggestion(s.name)}
              style={{
                width: "100%", textAlign: "left", padding: "8px 12px",
                background: "none", border: "none", borderBottom: `1px solid ${theme.border}`,
                cursor: "pointer", fontSize: 13, color: theme.text,
              }}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}
      {error && (
        <div style={{ fontSize: 12, color: "#dc2626", marginTop: 6 }}>{error}</div>
      )}
    </div>
  );
}

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
  const [slotErrors, setSlotErrors] = useState<Record<string, string>>({});

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
    setSlotErrors({});

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

    setMessage("Picks saved! Matched: " + (data.matched || []).join(", "));
    loadData();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: theme.text, margin: 0 }}>My Picks</h2>
        {isLocked && (
          <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 20, background: "rgba(220,38,38,0.08)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.2)", fontWeight: 600 }}>
            Picks Locked
          </span>
        )}
        {!isLocked && hasPicks && (
          <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 20, background: "rgba(22,163,74,0.08)", color: "#16a34a", border: "1px solid rgba(22,163,74,0.2)", fontWeight: 600 }}>
            Submitted
          </span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {SLOTS.map((slot) => (
          <GolferInput
            key={slot.key}
            slot={slot}
            value={picks[slot.key]}
            onChange={(v) => setPicks({ ...picks, [slot.key]: v })}
            disabled={isLocked}
            theme={theme}
            error={slotErrors[slot.key]}
          />
        ))}
      </div>

      {!isLocked && (
        <div style={{ marginTop: 16 }}>
          {message && (
            <div style={{
              fontSize: 13, marginBottom: 10, padding: "10px 14px", borderRadius: 8,
              background: message.includes("saved") ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.08)",
              color: message.includes("saved") ? "#16a34a" : "#dc2626",
              border: `1px solid ${message.includes("saved") ? "rgba(22,163,74,0.2)" : "rgba(220,38,38,0.2)"}`,
            }}>
              {message}
            </div>
          )}
          <button onClick={savePicks} disabled={saving} style={{
            width: "100%", padding: "14px", borderRadius: 12, border: "none",
            fontSize: 14, fontWeight: 700, cursor: saving ? "wait" : "pointer",
            background: theme.accent, color: theme.buttonText, opacity: saving ? 0.5 : 1,
          }}>
            {saving ? "Saving..." : hasPicks ? "Update Picks" : "Save Picks"}
          </button>
        </div>
      )}
    </div>
  );
}
