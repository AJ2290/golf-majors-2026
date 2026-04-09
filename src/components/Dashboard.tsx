"use client";

import { useState, useEffect } from "react";
import { Leaderboard } from "./Leaderboard";
import { PickTeam } from "./PickTeam";
import { AllPicks } from "./AllPicks";
import { Admin } from "./Admin";
import { getTheme, TOURNAMENT_META, DEFAULT_THEME, type TournamentTheme } from "@/lib/themes";

interface User {
  id: string;
  name: string;
  isAdmin: boolean;
}

interface Tournament {
  id: string;
  name: string;
  year: number;
  deadline: string;
  locked: boolean;
}

type View = "home" | "tournament";
type TournamentTab = "picks" | "all-picks" | "leaderboard" | "admin";

function useCountdown(target: string | null) {
  const [diff, setDiff] = useState<number | null>(null);
  useEffect(() => {
    if (!target) return;
    const tick = () => setDiff(new Date(target).getTime() - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return diff;
}

function formatCountdown(ms: number | null): { label: string; urgent: boolean; past: boolean } | null {
  if (ms === null) return null;
  if (ms <= 0) return { label: "Locked — Tee Off!", urgent: true, past: true };
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return { label: `${d}d ${h}h ${m}m ${sec}s`, urgent: false, past: false };
  if (h > 0) return { label: `${h}h ${m}m ${sec}s`, urgent: true, past: false };
  return { label: `${m}m ${sec}s`, urgent: true, past: false };
}

function CountdownBadge({ deadline }: { deadline: string }) {
  const diff = useCountdown(deadline);
  const cd = formatCountdown(diff);
  if (!cd) return null;

  const color = cd.past ? "#f87171" : cd.urgent ? "#fb923c" : "#4ade80";
  const bg = cd.past ? "rgba(248,113,113,0.12)" : cd.urgent ? "rgba(251,146,60,0.10)" : "rgba(74,222,128,0.12)";
  const border = cd.past ? "rgba(248,113,113,0.3)" : cd.urgent ? "rgba(251,146,60,0.3)" : "rgba(74,222,128,0.3)";

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12,
      padding: "4px 10px", borderRadius: 20, background: bg, color,
      border: `1px solid ${border}`, fontWeight: 600, fontVariantNumeric: "tabular-nums",
    }}>
      {cd.past ? "🔒" : "⏱"} {cd.label}
    </span>
  );
}

function TournamentCard({ tournament, onClick }: { tournament: Tournament; onClick: () => void }) {
  const theme = getTheme(tournament.name);
  const meta = TOURNAMENT_META[tournament.name];
  const isLocked = tournament.locked || new Date(tournament.deadline) <= new Date();

  return (
    <button onClick={onClick} className="w-full text-left theme-transition" style={{
      background: theme.gradient, border: `1px solid ${theme.border}`,
      borderRadius: 14, padding: "20px", cursor: "pointer",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 15, color: theme.accent, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
            {meta?.emoji} {tournament.name}
          </div>
          <div style={{ fontSize: 13, color: theme.muted }}>{meta?.venue}</div>
          <div style={{ fontSize: 12, color: theme.dim }}>{meta?.location}</div>
        </div>
        <div style={{
          fontSize: 12, padding: "4px 10px", borderRadius: 20, fontWeight: 600,
          background: isLocked ? "rgba(248,113,113,0.12)" : theme.accentLight,
          color: isLocked ? "#f87171" : theme.accent,
          border: `1px solid ${isLocked ? "rgba(248,113,113,0.3)" : theme.accentBorder}`,
        }}>
          {isLocked ? "Locked" : "Open"}
        </div>
      </div>
      <CountdownBadge deadline={tournament.deadline} />
    </button>
  );
}

function Rules() {
  const [open, setOpen] = useState(false);
  const theme = DEFAULT_THEME;
  return (
    <div style={{ marginTop: 20, background: "#ffffff", border: `1px solid ${theme.border}`, borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <button onClick={() => setOpen(!open)} style={{
        width: "100%", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "none", border: "none", cursor: "pointer",
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: theme.accent, margin: 0 }}>The Rules</h3>
        <span style={{ color: theme.dim, fontSize: 12 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div style={{ padding: "0 20px 16px", fontSize: 13, color: theme.muted, lineHeight: 2 }}>
          <p style={{ margin: "0 0 4px" }}>💷 <strong style={{ color: theme.text }}>£10 entry</strong> — winner takes the £60 pot</p>
          <p style={{ margin: "0 0 4px" }}>⛳ Each major: <strong style={{ color: theme.text }}>2 Europeans · 1 American · 1 Rest of World</strong></p>
          <p style={{ margin: "0 0 4px" }}>🚫 <strong style={{ color: theme.text }}>No player can be picked more than once</strong> across the 4 majors</p>
          <p style={{ margin: "0 0 4px" }}>📊 Score = combined total to par for all 4 players · lowest wins</p>
          <p style={{ margin: "0 0 4px" }}>✂️ Missed cut / WD: <strong style={{ color: theme.text }}>R1+R2 + worst R3 + worst R4 in field</strong></p>
          <p style={{ margin: 0 }}>⏱ Picks can be <strong style={{ color: theme.text }}>updated right up to the first tee shot</strong> of each major</p>
        </div>
      )}
    </div>
  );
}

export function Dashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [view, setView] = useState<View>("home");
  const [activeTournament, setActiveTournament] = useState<Tournament | null>(null);
  const [tournamentTab, setTournamentTab] = useState<TournamentTab>("picks");
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tournaments")
      .then((r) => r.json())
      .then((data) => {
        setTournaments((data.tournaments || []).map((t: Tournament) => ({
          id: t.id, name: t.name, year: t.year, deadline: t.deadline, locked: t.locked,
        })));
        setLoading(false);
      });
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    onLogout();
  };

  const openTournament = (t: Tournament) => {
    setActiveTournament(t);
    setTournamentTab("picks");
    setView("tournament");
  };

  const theme = activeTournament ? getTheme(activeTournament.name) : DEFAULT_THEME;

  if (loading) {
    return (
      <div style={{ background: DEFAULT_THEME.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: DEFAULT_THEME.muted }}>Loading...</div>
      </div>
    );
  }

  // ── Home view ──
  if (view === "home") {
    return (
      <div style={{ background: DEFAULT_THEME.bg, minHeight: "100vh" }} className="theme-transition">
        <header style={{ background: "#ffffff", borderBottom: `1px solid ${DEFAULT_THEME.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <div style={{ maxWidth: 600, margin: "0 auto", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: DEFAULT_THEME.accent, margin: 0 }}>Golf Majors 2026</h1>
              <p style={{ fontSize: 12, color: DEFAULT_THEME.muted, margin: "2px 0 0" }}>Logged in as {user.name}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 12, color: DEFAULT_THEME.accent, fontWeight: 600, background: DEFAULT_THEME.accentLight, padding: "4px 10px", borderRadius: 20, border: `1px solid ${DEFAULT_THEME.accentBorder}` }}>
                £60 pot
              </span>
              <button onClick={logout} style={{ fontSize: 12, color: DEFAULT_THEME.dim, background: "none", border: "none", cursor: "pointer" }}>
                Logout
              </button>
            </div>
          </div>
        </header>

        <div style={{ maxWidth: 600, margin: "0 auto", padding: "20px" }}>
          {/* Overall standings — front and centre */}
          <div style={{ marginBottom: 4 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: DEFAULT_THEME.accent, margin: "0 0 4px", fontStyle: "italic" }}>
              Overall Standings
            </h2>
            <p style={{ fontSize: 13, color: DEFAULT_THEME.muted, margin: "0 0 16px" }}>Cumulative score across all revealed majors</p>
          </div>
          <div style={{ background: "#ffffff", border: `1px solid ${DEFAULT_THEME.border}`, borderRadius: 14, padding: "8px 12px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <Leaderboard compact />
          </div>

          {/* Tournament cards */}
          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 14 }}>
            {tournaments.map((t) => (
              <TournamentCard key={t.id} tournament={t} onClick={() => openTournament(t)} />
            ))}
          </div>

          {/* Rules — collapsible */}
          <Rules />

          {/* Admin link */}
          {user.isAdmin && (
            <button
              onClick={() => { setView("tournament"); setActiveTournament(null); setTournamentTab("admin"); }}
              style={{
                marginTop: 16, width: "100%", padding: "12px", background: "#ffffff",
                border: `1px solid ${DEFAULT_THEME.border}`, borderRadius: 10,
                color: DEFAULT_THEME.muted, fontSize: 13, cursor: "pointer", fontWeight: 600,
              }}
            >
              Admin Panel
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Tournament view ──
  const tabs: { key: TournamentTab; label: string; show: boolean }[] = [
    { key: "picks", label: "My Picks", show: !!activeTournament },
    { key: "all-picks", label: "All Picks", show: !!activeTournament },
    { key: "leaderboard", label: "Scores", show: !!activeTournament },
    { key: "admin", label: "Admin", show: user.isAdmin },
  ];

  return (
    <div style={{ background: theme.bg, minHeight: "100vh" }} className="theme-transition">
      <header style={{ borderBottom: `1px solid ${theme.border}` }}>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "12px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={() => setView("home")} style={{ background: "none", border: "none", color: theme.accent, cursor: "pointer", fontSize: 14, fontWeight: 600, padding: 0 }}>
                ← Back
              </button>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: theme.accent, margin: 0 }}>
                {activeTournament?.name || "Admin"}
              </h1>
            </div>
            {activeTournament && <CountdownBadge deadline={activeTournament.deadline} />}
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {tabs.filter((t) => t.show).map((t) => (
              <button
                key={t.key}
                onClick={() => setTournamentTab(t.key)}
                style={{
                  padding: "8px 16px", fontSize: 13, fontWeight: 600,
                  borderRadius: "8px 8px 0 0", border: "none", cursor: "pointer",
                  background: tournamentTab === t.key ? theme.accentLight : "transparent",
                  color: tournamentTab === t.key ? theme.accent : theme.dim,
                  borderBottom: tournamentTab === t.key ? `2px solid ${theme.accent}` : "2px solid transparent",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 600, margin: "0 auto", padding: "20px" }}>
        {tournamentTab === "picks" && activeTournament && (
          <PickTeam userId={user.id} tournamentId={activeTournament.id} theme={theme} />
        )}
        {tournamentTab === "all-picks" && activeTournament && (
          <AllPicks tournamentId={activeTournament.id} theme={theme} />
        )}
        {tournamentTab === "leaderboard" && activeTournament && (
          <Leaderboard tournamentId={activeTournament.id} theme={theme} />
        )}
        {tournamentTab === "admin" && user.isAdmin && <Admin />}
      </main>
    </div>
  );
}
