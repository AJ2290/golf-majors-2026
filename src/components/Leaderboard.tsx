"use client";

import { useState, useEffect } from "react";
import { DEFAULT_THEME, type TournamentTheme } from "@/lib/themes";

interface PickDetail {
  name: string;
  score: number;
  status: string;
}

interface MajorScore {
  score: number;
  picks: PickDetail[];
}

interface LeaderboardEntry {
  id: string;
  name: string;
  totalScore: number;
  majors: Record<string, MajorScore>;
}

function formatScore(score: number) {
  if (score === 0) return "E";
  return score > 0 ? `+${score}` : `${score}`;
}

function scoreColor(score: number) {
  if (score < 0) return "#16a34a";
  if (score === 0) return "#737373";
  return "#dc2626";
}

// Compact mode: shown on the home page
function CompactLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const theme = DEFAULT_THEME;

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((data) => {
        setLeaderboard(data.leaderboard || []);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ color: theme.dim, fontSize: 13 }}>Loading...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {leaderboard.map((entry, i) => (
        <div
          key={entry.id}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 12px",
            borderRadius: 8,
            background: i === 0 ? theme.accentLight : "transparent",
            border: i === 0 ? `1px solid ${theme.accentBorder}` : "1px solid transparent",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: i === 0 ? theme.accent : theme.dim, width: 20 }}>
              {i + 1}
            </span>
            <span style={{ fontSize: 14, fontWeight: 600, color: theme.text }}>{entry.name}</span>
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: scoreColor(entry.totalScore) }}>
            {formatScore(entry.totalScore)}
          </span>
        </div>
      ))}
    </div>
  );
}

// Full mode: shown within a tournament view
function FullLeaderboard({ tournamentId, theme }: { tournamentId: string; theme: TournamentTheme }) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [tournaments, setTournaments] = useState<{ id: string; name: string; locked: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((data) => {
        setLeaderboard(data.leaderboard || []);
        setTournaments(data.tournaments || []);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ color: theme.dim, fontSize: 13 }}>Loading leaderboard...</div>;

  const currentTournament = tournaments.find((t) => t.id === tournamentId);
  const tournamentName = currentTournament?.name || "";

  const hasScores = leaderboard.some((e) => e.majors[tournamentName]);

  if (!hasScores) {
    return (
      <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 14, padding: "32px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🏌️</div>
        <div style={{ color: theme.muted, fontSize: 14 }}>No scores yet</div>
        <div style={{ color: theme.dim, fontSize: 12, marginTop: 4 }}>The leaderboard will update once the tournament begins</div>
      </div>
    );
  }

  // Sort by this tournament's score
  const sorted = [...leaderboard]
    .filter((e) => e.majors[tournamentName])
    .sort((a, b) => (a.majors[tournamentName]?.score ?? 999) - (b.majors[tournamentName]?.score ?? 999));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: theme.text, margin: 0 }}>Leaderboard</h2>
        <span style={{ fontSize: 12, color: theme.accent, fontWeight: 600, background: theme.accentLight, padding: "4px 10px", borderRadius: 20, border: `1px solid ${theme.accentBorder}` }}>
          £60 pot
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sorted.map((entry, i) => {
          const major = entry.majors[tournamentName];
          return (
            <div
              key={entry.id}
              style={{
                background: theme.bgCard,
                border: `1px solid ${theme.border}`,
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <button
                onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{
                    fontSize: 18,
                    fontWeight: 800,
                    width: 28,
                    color: i === 0 ? theme.accent : theme.dim,
                  }}>
                    {i + 1}
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 600, color: theme.text }}>{entry.name}</span>
                </div>
                <span style={{ fontSize: 18, fontWeight: 700, color: scoreColor(major.score) }}>
                  {formatScore(major.score)}
                </span>
              </button>

              {expanded === entry.id && (
                <div style={{ padding: "0 16px 14px", borderTop: `1px solid ${theme.border}` }}>
                  {major.picks.map((p) => (
                    <div key={p.name} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0 6px 40px", fontSize: 13 }}>
                      <span style={{ color: theme.muted }}>
                        {p.name}
                        {p.status !== "active" && (
                          <span style={{ color: "#f87171", marginLeft: 6, fontSize: 11 }}>({p.status.toUpperCase()})</span>
                        )}
                      </span>
                      <span style={{ fontWeight: 600, color: scoreColor(p.score) }}>{formatScore(p.score)}</span>
                    </div>
                  ))}

                  {/* Overall score across all majors */}
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", paddingLeft: 40 }}>
                    <span style={{ fontSize: 12, color: theme.dim, fontWeight: 600 }}>Overall (all majors)</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: scoreColor(entry.totalScore) }}>{formatScore(entry.totalScore)}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Leaderboard({
  compact,
  tournamentId,
  theme,
}: {
  compact?: boolean;
  tournamentId?: string;
  theme?: TournamentTheme;
}) {
  if (compact) return <CompactLeaderboard />;
  return <FullLeaderboard tournamentId={tournamentId!} theme={theme || DEFAULT_THEME} />;
}
