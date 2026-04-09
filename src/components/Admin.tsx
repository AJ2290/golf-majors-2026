"use client";

import { useState, useEffect, useCallback } from "react";
import { DEFAULT_THEME } from "@/lib/themes";

const t = DEFAULT_THEME;

interface Tournament {
  id: string;
  name: string;
  year: number;
  deadline: string;
  locked: boolean;
  espnId: string | null;
  lastSyncAt: string | null;
}

interface PickStatus {
  name: string;
  tournaments: { tournamentId: string; tournamentName: string; pickCount: number; complete: boolean }[];
}

export function Admin() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [golferCount, setGolferCount] = useState(0);
  const [pickStatus, setPickStatus] = useState<PickStatus[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    const [tRes, gRes, pRes] = await Promise.all([
      fetch("/api/tournaments"),
      fetch("/api/golfers"),
      fetch("/api/admin/pick-status"),
    ]);
    const tData = await tRes.json();
    const gData = await gRes.json();
    const pData = await pRes.json();
    setTournaments(tData.tournaments || []);
    setGolferCount(gData.golfers?.length || 0);
    setPickStatus(pData.status || []);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const syncScores = async () => {
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/admin/sync-scores", { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setMessage(`Synced ${data.synced} scores successfully`);
    } else {
      setMessage(`Error: ${data.error}`);
    }
    setLoading(false);
    loadData();
  };

  const syncField = async (espnId: string) => {
    if (!espnId) { setMessage("No ESPN ID configured"); return; }
    setLoading(true);
    const res = await fetch("/api/admin/sync-field", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ espnEventId: espnId }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage(`Synced field: ${data.created} new, ${data.updated} updated (${data.total} total)`);
    } else {
      setMessage(`Error: ${data.error}`);
    }
    setLoading(false);
    loadData();
  };

  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: t.text, margin: "0 0 16px" }}>Admin</h2>

      {message && (
        <div style={{
          padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13,
          background: message.includes("Error") ? "rgba(220,38,38,0.08)" : "rgba(22,163,74,0.08)",
          color: message.includes("Error") ? "#dc2626" : "#16a34a",
          border: `1px solid ${message.includes("Error") ? "rgba(220,38,38,0.2)" : "rgba(22,163,74,0.2)"}`,
        }}>
          {message}
        </div>
      )}

      {/* Quick stats */}
      <div style={{ background: "#ffffff", border: `1px solid ${t.border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: t.muted, marginBottom: 8 }}>
          <strong style={{ color: t.text }}>{golferCount}</strong> golfers in database
        </div>
        <button onClick={syncScores} disabled={loading} style={{
          padding: "10px 20px", borderRadius: 8, border: "none", fontSize: 13,
          fontWeight: 600, cursor: "pointer", background: t.accent, color: "#ffffff",
          opacity: loading ? 0.5 : 1, marginRight: 8,
        }}>
          {loading ? "Syncing..." : "Sync All Scores"}
        </button>
      </div>

      {/* Pick status */}
      <div style={{ background: "#ffffff", border: `1px solid ${t.border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: t.text, margin: "0 0 12px" }}>Pick Status</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "6px 8px", color: t.muted, fontWeight: 600, borderBottom: `1px solid ${t.border}` }}>Player</th>
                {tournaments.map((tour) => (
                  <th key={tour.id} style={{ textAlign: "center", padding: "6px 8px", color: t.muted, fontWeight: 600, borderBottom: `1px solid ${t.border}`, whiteSpace: "nowrap" }}>
                    {tour.name.replace("The ", "").replace(" Championship", "")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pickStatus.map((player) => (
                <tr key={player.name}>
                  <td style={{ padding: "8px", fontWeight: 600, color: t.text, borderBottom: `1px solid ${t.border}` }}>{player.name}</td>
                  {player.tournaments.map((pt) => (
                    <td key={pt.tournamentId} style={{ textAlign: "center", padding: "8px", borderBottom: `1px solid ${t.border}` }}>
                      {pt.complete ? (
                        <span style={{ color: "#16a34a", fontWeight: 700 }}>✓</span>
                      ) : pt.pickCount > 0 ? (
                        <span style={{ color: "#f59e0b", fontWeight: 600 }}>{pt.pickCount}/4</span>
                      ) : (
                        <span style={{ color: t.dim }}>—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Per-tournament details */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {tournaments.map((tour) => (
          <div key={tour.id} style={{ background: "#ffffff", border: `1px solid ${t.border}`, borderRadius: 12, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: t.text, margin: 0 }}>{tour.name}</h3>
              <span style={{
                fontSize: 11, padding: "3px 8px", borderRadius: 12, fontWeight: 600,
                background: tour.locked ? "rgba(220,38,38,0.08)" : "rgba(22,163,74,0.08)",
                color: tour.locked ? "#dc2626" : "#16a34a",
              }}>
                {tour.locked ? "Locked" : "Open"}
              </span>
            </div>

            <div style={{ fontSize: 12, color: t.muted, marginBottom: 8 }}>
              ESPN ID: <strong style={{ color: t.text }}>{tour.espnId || "Not set"}</strong>
            </div>

            <div style={{ fontSize: 12, color: t.muted, marginBottom: 10 }}>
              Last synced: <strong style={{ color: t.text }}>
                {tour.lastSyncAt ? new Date(tour.lastSyncAt).toLocaleString("en-GB") : "Never"}
              </strong>
            </div>

            <button onClick={() => syncField(tour.espnId || "")} disabled={loading || !tour.espnId} style={{
              padding: "6px 14px", borderRadius: 6, border: `1px solid ${t.border}`,
              fontSize: 12, fontWeight: 600, cursor: "pointer",
              background: "#fafafa", color: t.text,
              opacity: loading || !tour.espnId ? 0.4 : 1,
            }}>
              Sync Golfer Field
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
