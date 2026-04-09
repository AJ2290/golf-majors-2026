"use client";

import { useState, useEffect } from "react";
import { DEFAULT_THEME, type TournamentTheme } from "@/lib/themes";

interface Pick {
  slot: string;
  golfer: { name: string; region: string };
  competitor: { id: string; name: string };
}

interface Tournament {
  id: string;
  name: string;
  locked: boolean;
  deadline: string;
  picks: Pick[];
}

const SLOT_ORDER = ["eu1", "eu2", "us", "row"];
const SLOT_LABELS: Record<string, string> = {
  eu1: "🇪🇺 European #1",
  eu2: "🇪🇺 European #2",
  us: "🇺🇸 American",
  row: "🌍 Rest of World",
};

export function AllPicks({
  tournamentId,
  theme = DEFAULT_THEME,
}: {
  tournamentId: string;
  theme?: TournamentTheme;
}) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tournaments")
      .then((r) => r.json())
      .then((data) => {
        const t = (data.tournaments || []).find((t: Tournament) => t.id === tournamentId);
        setTournament(t || null);
        setLoading(false);
      });
  }, [tournamentId]);

  if (loading) return <div style={{ color: theme.dim, fontSize: 13 }}>Loading...</div>;

  if (!tournament) return null;

  const isLocked = tournament.locked || new Date(tournament.deadline) <= new Date();

  if (!isLocked) {
    return (
      <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 14, padding: "32px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🤫</div>
        <div style={{ color: theme.muted, fontSize: 14 }}>Picks are hidden until the deadline</div>
        <div style={{ color: theme.dim, fontSize: 12, marginTop: 4 }}>
          Reveals {new Date(tournament.deadline).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
        </div>
      </div>
    );
  }

  // Group picks by competitor
  const byCompetitor = new Map<string, { name: string; picks: Record<string, string> }>();
  for (const pick of tournament.picks) {
    if (!byCompetitor.has(pick.competitor.id)) {
      byCompetitor.set(pick.competitor.id, { name: pick.competitor.name, picks: {} });
    }
    byCompetitor.get(pick.competitor.id)!.picks[pick.slot] = pick.golfer.name;
  }

  const competitors = Array.from(byCompetitor.values()).sort((a, b) => a.name.localeCompare(b.name));

  if (competitors.length === 0) {
    return (
      <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 14, padding: "32px 20px", textAlign: "center" }}>
        <div style={{ color: theme.muted, fontSize: 14 }}>No picks submitted for this major</div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: theme.text, margin: "0 0 16px" }}>All Picks</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {competitors.map((comp) => (
          <div
            key={comp.name}
            style={{
              background: theme.bgCard,
              border: `1px solid ${theme.border}`,
              borderRadius: 12,
              padding: "14px 16px",
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: theme.accent, marginBottom: 10, letterSpacing: 0.3 }}>
              {comp.name}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {SLOT_ORDER.map((slot) => (
                <div key={slot} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: theme.dim }}>{SLOT_LABELS[slot]}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>
                    {comp.picks[slot] || "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
