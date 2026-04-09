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

const MAJOR_COLS = [
  { key: "The Masters", logo: "/masters-logo.png" },
  { key: "PGA Championship", logo: "/pga-logo.png" },
  { key: "US Open", logo: "/usopen-logo.png" },
  { key: "The Open", logo: "/theopen-logo.png" },
];

// Compact mode: Sky Sports Masters style — light grey, clean rows, green scores
function CompactLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((data) => {
        setLeaderboard(data.leaderboard || []);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ color: "rgba(0,0,0,0.4)", fontSize: 13 }}>Loading...</div>;

  const hasAnyScores = leaderboard.some((e) => Object.keys(e.majors).length > 0);

  return (
    <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #ddd" }}>
      {/* Green header bar */}
      <div style={{
        background: "#165f3b", padding: "12px 20px",
        display: "flex", justifyContent: "center", alignItems: "center",
      }}>
        <span style={{
          fontSize: 20, fontWeight: 700, color: "#ffffff",
          fontStyle: "italic", letterSpacing: 1,
        }}>
          Overall Standings
        </span>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", background: "#ffffff" }}>
          <thead>
            <tr style={{ background: "#f0f0f0" }}>
              <th style={{ padding: "10px 8px", width: 30, textAlign: "center", fontSize: 11, fontWeight: 700, color: "#555", borderBottom: "2px solid #165f3b" }}></th>
              <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#555", borderBottom: "2px solid #165f3b", textTransform: "uppercase", letterSpacing: 1 }}>Player</th>
              {MAJOR_COLS.map((m) => (
                <th key={m.key} style={{ padding: "8px 8px", textAlign: "center", borderBottom: "2px solid #165f3b" }}>
                  <img src={m.logo} alt="" style={{ width: 24, height: 24, objectFit: "contain", display: "block", margin: "0 auto" }} />
                </th>
              ))}
              <th style={{ padding: "10px 12px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#555", borderBottom: "2px solid #165f3b", textTransform: "uppercase", letterSpacing: 1 }}>
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry, i) => (
              <tr key={entry.id} style={{ background: i % 2 === 0 ? "#ffffff" : "#f7f7f7" }}>
                <td style={{ padding: "12px 8px", textAlign: "center", fontWeight: 700, color: "#165f3b", fontSize: 14, borderBottom: "1px solid #e5e5e5" }}>
                  {hasAnyScores ? i + 1 : "—"}
                </td>
                <td style={{ padding: "12px 12px", fontWeight: 700, color: "#1a1a1a", fontSize: 14, borderBottom: "1px solid #e5e5e5", whiteSpace: "nowrap", textTransform: "uppercase" }}>
                  {entry.name}
                </td>
                {MAJOR_COLS.map((m) => {
                  const major = entry.majors[m.key];
                  return (
                    <td key={m.key} style={{ padding: "12px 8px", textAlign: "center", borderBottom: "1px solid #e5e5e5" }}>
                      {major ? (
                        <span style={{
                          fontSize: 14, fontWeight: 700,
                          color: scoreColor(major.score),
                        }}>
                          {formatScore(major.score)}
                        </span>
                      ) : (
                        <span style={{ color: "#bbb", fontSize: 12 }}>—</span>
                      )}
                    </td>
                  );
                })}
                <td style={{ padding: "12px 12px", textAlign: "center", fontWeight: 800, fontSize: 15, color: hasAnyScores ? scoreColor(entry.totalScore) : "#bbb", borderBottom: "1px solid #e5e5e5" }}>
                  {hasAnyScores ? formatScore(entry.totalScore) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Masters leaderboard — always expanded with picks
function MastersLeaderboard({ sorted, tournamentName }: {
  sorted: LeaderboardEntry[];
  tournamentName: string;
}) {
  return (
    <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #ddd" }}>
      {/* Green header */}
      <div style={{
        background: "#165f3b", padding: "14px 20px",
        display: "flex", justifyContent: "center", alignItems: "center",
      }}>
        <span style={{
          fontSize: 22, fontWeight: 700, color: "#ffffff",
          fontStyle: "italic", letterSpacing: 1,
        }}>
          Masters
        </span>
      </div>

      {/* Subheader */}
      <div style={{
        background: "#f0f0f0", padding: "8px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "2px solid #165f3b",
      }}>
        <span style={{ fontSize: 11, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Leaderboard</span>
        <span style={{ fontSize: 12, color: "#165f3b", fontWeight: 600 }}>£60 pot</span>
      </div>

      {/* Rows — always expanded */}
      {sorted.map((entry, i) => {
        const major = entry.majors[tournamentName];
        return (
          <div key={entry.id}>
            <div style={{
              width: "100%", padding: "12px 20px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: i % 2 === 0 ? "#ffffff" : "#f7f7f7",
              borderBottom: "1px solid #e5e5e5",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ fontSize: 16, fontWeight: 700, width: 24, color: "#165f3b", textAlign: "center" }}>
                  {i + 1}
                </span>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", textTransform: "uppercase" }}>
                  {entry.name}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: scoreColor(major.score) }}>
                  {formatScore(major.score)}
                </span>
              </div>
            </div>

            <div style={{ background: "#fafafa", borderBottom: "1px solid #e5e5e5" }}>
              {major.picks.map((p) => (
                <div key={p.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 20px 8px 58px", fontSize: 13, borderBottom: "1px solid #eee" }}>
                  <span style={{ color: "#333", fontWeight: 600 }}>
                    {p.name}
                    {p.status !== "active" && p.status !== "pending" && (
                      <span style={{ color: "#dc2626", marginLeft: 6, fontSize: 11, fontWeight: 700 }}>({p.status.toUpperCase()})</span>
                    )}
                  </span>
                  <span style={{ fontWeight: 700, color: scoreColor(p.score) }}>{formatScore(p.score)}</span>
                </div>
              ))}
              <div style={{ padding: "8px 20px 10px 58px", borderTop: "1px solid #ddd", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#165f3b", fontWeight: 700 }}>Overall (all majors)</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: scoreColor(entry.totalScore) }}>{formatScore(entry.totalScore)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Default leaderboard style (used for PGA, US Open, The Open) — always expanded
function DefaultLeaderboard({ sorted, tournamentName, theme }: {
  sorted: LeaderboardEntry[];
  tournamentName: string;
  theme: TournamentTheme;
}) {
  return (
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
            <div style={{
              width: "100%",
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 18, fontWeight: 800, width: 28, color: i === 0 ? theme.accent : theme.dim }}>
                  {i + 1}
                </span>
                <span style={{ fontSize: 15, fontWeight: 600, color: theme.text }}>{entry.name}</span>
              </div>
              <span style={{ fontSize: 18, fontWeight: 700, color: scoreColor(major.score) }}>
                {formatScore(major.score)}
              </span>
            </div>

            <div style={{ padding: "0 16px 14px", borderTop: `1px solid ${theme.border}` }}>
              {major.picks.map((p) => (
                <div key={p.name} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0 6px 40px", fontSize: 13 }}>
                  <span style={{ color: theme.muted }}>
                    {p.name}
                    {p.status !== "active" && p.status !== "pending" && (
                      <span style={{ color: "#f87171", marginLeft: 6, fontSize: 11 }}>({p.status.toUpperCase()})</span>
                    )}
                  </span>
                  <span style={{ fontWeight: 600, color: scoreColor(p.score) }}>{formatScore(p.score)}</span>
                </div>
              ))}
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", paddingLeft: 40 }}>
                <span style={{ fontSize: 12, color: theme.dim, fontWeight: 600 }}>Overall (all majors)</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: scoreColor(entry.totalScore) }}>{formatScore(entry.totalScore)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Full mode: shown within a tournament view
function FullLeaderboard({ tournamentId, theme }: { tournamentId: string; theme: TournamentTheme }) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [tournaments, setTournaments] = useState<{ id: string; name: string; locked: boolean }[]>([]);
  const [loading, setLoading] = useState(true);

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
  const isMasters = tournamentName === "The Masters";

  const hasScores = leaderboard.some((e) => e.majors[tournamentName]);

  if (!hasScores) {
    return (
      <div style={{
        background: isMasters ? "#1a472a" : theme.bgCard,
        border: isMasters ? "3px solid #d4af37" : `1px solid ${theme.border}`,
        borderRadius: 14, padding: "32px 20px", textAlign: "center",
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🏌️</div>
        <div style={{ color: isMasters ? "#d4af37" : theme.muted, fontSize: 14 }}>No scores yet</div>
        <div style={{ color: isMasters ? "rgba(255,255,255,0.5)" : theme.dim, fontSize: 12, marginTop: 4 }}>The leaderboard will update once the tournament begins</div>
      </div>
    );
  }

  const sorted = [...leaderboard]
    .filter((e) => e.majors[tournamentName])
    .sort((a, b) => (a.majors[tournamentName]?.score ?? 999) - (b.majors[tournamentName]?.score ?? 999));

  return (
    <div>
      {!isMasters && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: theme.text, margin: 0 }}>Leaderboard</h2>
          <span style={{ fontSize: 12, color: theme.accent, fontWeight: 600, background: theme.accentLight, padding: "4px 10px", borderRadius: 20, border: `1px solid ${theme.accentBorder}` }}>
            £60 pot
          </span>
        </div>
      )}

      {isMasters ? (
        <MastersLeaderboard sorted={sorted} tournamentName={tournamentName} />
      ) : (
        <DefaultLeaderboard sorted={sorted} tournamentName={tournamentName} theme={theme} />
      )}
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
