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

function formatCountdown(ms: number | null): { label: string; urgent: boolean; past: boolean; live: boolean } | null {
  if (ms === null) return null;
  if (ms <= 0) {
    // Tournament lasts ~4 days from first tee
    const daysPast = Math.abs(ms) / (1000 * 60 * 60 * 24);
    if (daysPast <= 4) return { label: "LIVE", urgent: true, past: true, live: true };
    return { label: "Complete", urgent: false, past: true, live: false };
  }
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return { label: `${d}d ${h}h ${m}m ${sec}s`, urgent: false, past: false, live: false };
  if (h > 0) return { label: `${h}h ${m}m ${sec}s`, urgent: true, past: false, live: false };
  return { label: `${m}m ${sec}s`, urgent: true, past: false, live: false };
}

function CountdownBadge({ deadline }: { deadline: string }) {
  const diff = useCountdown(deadline);
  const cd = formatCountdown(diff);
  if (!cd) return null;

  if (cd.live) {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12,
        padding: "4px 12px", borderRadius: 20, background: "rgba(220,38,38,0.10)",
        color: "#dc2626", border: "1px solid rgba(220,38,38,0.3)", fontWeight: 700,
        letterSpacing: 1.5, textTransform: "uppercase",
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: "50%", background: "#dc2626",
          animation: "livePulse 1.5s ease-in-out infinite",
        }} />
        LIVE
      </span>
    );
  }

  const color = cd.past ? "#737373" : cd.urgent ? "#fb923c" : "#4ade80";
  const bg = cd.past ? "rgba(115,115,115,0.10)" : cd.urgent ? "rgba(251,146,60,0.10)" : "rgba(74,222,128,0.12)";
  const border = cd.past ? "rgba(115,115,115,0.3)" : cd.urgent ? "rgba(251,146,60,0.3)" : "rgba(74,222,128,0.3)";

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12,
      padding: "4px 10px", borderRadius: 20, background: bg, color,
      border: `1px solid ${border}`, fontWeight: 600, fontVariantNumeric: "tabular-nums",
    }}>
      {cd.past ? "✓" : "⏱"} {cd.label}
    </span>
  );
}

function TournamentCard({ tournament, onClick }: { tournament: Tournament; onClick: () => void }) {
  const theme = getTheme(tournament.name);
  const meta = TOURNAMENT_META[tournament.name];
  const isLocked = tournament.locked || new Date(tournament.deadline) <= new Date();
  const diff = new Date(tournament.deadline).getTime() - Date.now();
  const daysPast = diff <= 0 ? Math.abs(diff) / (1000 * 60 * 60 * 24) : 0;
  const isLive = diff <= 0 && daysPast <= 4;
  const isComplete = diff <= 0 && daysPast > 4;

  const statusLabel = isLive ? "Live" : isComplete ? "Complete" : isLocked ? "Locked" : "Open";
  const statusBg = isLive ? "rgba(220,38,38,0.10)" : isComplete ? "rgba(115,115,115,0.08)" : isLocked ? "rgba(248,113,113,0.12)" : theme.accentLight;
  const statusColor = isLive ? "#dc2626" : isComplete ? "#737373" : isLocked ? "#f87171" : theme.accent;
  const statusBorder = isLive ? "rgba(220,38,38,0.3)" : isComplete ? "rgba(115,115,115,0.2)" : isLocked ? "rgba(248,113,113,0.3)" : theme.accentBorder;

  return (
    <button onClick={onClick} className="text-left theme-transition" style={{
      background: theme.gradient, border: `1px solid ${theme.border}`,
      borderRadius: 14, padding: "16px", cursor: "pointer",
      flex: "1 1 0", minWidth: 150,
    }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 8 }}>
        {meta?.logo && (
          <img src={meta.logo} alt="" style={{ width: 36, height: 36, objectFit: "contain" }} />
        )}
        <div>
          <div style={{ fontSize: 13, color: theme.accent, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 }}>
            {tournament.name}
          </div>
          <div style={{ fontSize: 11, color: theme.muted, marginBottom: 2 }}>{meta?.venue}</div>
        </div>
        <div style={{
          fontSize: 11, padding: "3px 8px", borderRadius: 20, fontWeight: 600,
          background: statusBg, color: statusColor,
          border: `1px solid ${statusBorder}`,
        }}>
          {statusLabel}
        </div>
        <CountdownBadge deadline={tournament.deadline} />
      </div>
    </button>
  );
}

function Rules() {
  return (
    <div style={{ marginBottom: 20, background: "#ffffff", border: `1px solid ${DEFAULT_THEME.border}`, borderRadius: 14, padding: "16px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: DEFAULT_THEME.accent, margin: "0 0 10px" }}>The Rules</h3>
      <div style={{ fontSize: 13, color: DEFAULT_THEME.muted, lineHeight: 2 }}>
        <p style={{ margin: "0 0 4px" }}>💷 <strong style={{ color: DEFAULT_THEME.text }}>£10 entry</strong> — winner takes the £60 pot</p>
        <p style={{ margin: "0 0 4px" }}>⛳ Each major: <strong style={{ color: DEFAULT_THEME.text }}>2 Europeans · 1 American · 1 Rest of World</strong></p>
        <p style={{ margin: "0 0 4px" }}>🚫 <strong style={{ color: DEFAULT_THEME.text }}>No player can be picked more than once</strong> across the 4 majors</p>
        <p style={{ margin: "0 0 4px" }}>📊 Score = combined total to par for all 4 players · lowest wins</p>
        <p style={{ margin: "0 0 4px" }}>✂️ Missed cut / WD: <strong style={{ color: DEFAULT_THEME.text }}>R1+R2 + worst R3 + worst R4 in field</strong></p>
        <p style={{ margin: 0 }}>⏱ Picks can be <strong style={{ color: DEFAULT_THEME.text }}>updated right up to the first tee shot</strong> of each major</p>
      </div>
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
        <header style={{ background: "#165f3b", borderBottom: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
          <div style={{ maxWidth: 900, margin: "0 auto", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#d4af37", margin: 0 }}>Golf Majors 2026</h1>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: "2px 0 0" }}>Logged in as {user.name}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 12, color: "#d4af37", fontWeight: 600, background: "rgba(212,175,55,0.15)", padding: "4px 10px", borderRadius: 20, border: "1px solid rgba(212,175,55,0.3)" }}>
                £60 pot
              </span>
              <button onClick={logout} style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", background: "none", border: "none", cursor: "pointer" }}>
                Logout
              </button>
            </div>
          </div>
        </header>

        <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px" }}>
          {/* Rules */}
          <Rules />

          {/* Overall standings */}
          <Leaderboard compact />

          {/* Tournament cards */}
          <div style={{ marginTop: 20, display: "flex", flexDirection: "row", gap: 12, overflowX: "auto" }}>
            {tournaments.map((t) => (
              <TournamentCard key={t.id} tournament={t} onClick={() => openTournament(t)} />
            ))}
          </div>

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
