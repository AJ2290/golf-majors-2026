const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/golf/pga";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ESPNCompetitor = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ESPNEvent = any;

// European countries for region classification
const EU_COUNTRIES = new Set([
  "United Kingdom",
  "England",
  "Scotland",
  "Wales",
  "Northern Ireland",
  "Ireland",
  "France",
  "Germany",
  "Spain",
  "Italy",
  "Sweden",
  "Norway",
  "Denmark",
  "Finland",
  "Netherlands",
  "Belgium",
  "Austria",
  "Switzerland",
  "Portugal",
  "Poland",
  "Czech Republic",
  "Romania",
  "Hungary",
  "Greece",
  "Croatia",
  "Serbia",
  "Bulgaria",
  "Slovakia",
  "Slovenia",
  "Estonia",
  "Latvia",
  "Lithuania",
  "Iceland",
  "Luxembourg",
  "Malta",
  "Cyprus",
  "Turkey",
]);

const US_COUNTRIES = new Set(["United States", "USA", "Puerto Rico"]);

export function classifyRegion(country: string): "EU" | "US" | "ROW" {
  if (EU_COUNTRIES.has(country)) return "EU";
  if (US_COUNTRIES.has(country)) return "US";
  return "ROW";
}

export async function fetchTournamentField(espnEventId: string) {
  const res = await fetch(
    `${ESPN_BASE}/scoreboard?event=${espnEventId}`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) throw new Error(`ESPN API error: ${res.status}`);
  const data = await res.json();

  const event: ESPNEvent = data.events?.[0];
  if (!event) return [];

  const competitors: ESPNCompetitor[] = event.competitions[0]?.competitors || [];

  return competitors.map((c: ESPNCompetitor) => {
    const country = c.athlete?.flag?.alt || "Unknown";
    return {
      espnId: c.id,
      name: c.athlete?.displayName || c.athlete?.fullName || "Unknown",
      citizenship: country,
      region: classifyRegion(country),
    };
  });
}

export async function fetchTournamentScores(espnEventId: string) {
  const res = await fetch(
    `${ESPN_BASE}/scoreboard?event=${espnEventId}`,
    { next: { revalidate: 300 } }
  );
  if (!res.ok) throw new Error(`ESPN API error: ${res.status}`);
  const data = await res.json();

  const event: ESPNEvent = data.events?.[0];
  if (!event) return { scores: [], worstR3: 0, worstR4: 0 };

  const competitors: ESPNCompetitor[] = event.competitions[0]?.competitors || [];

  let worstR3 = -999;
  let worstR4 = -999;

  const scores = competitors.map((c: ESPNCompetitor) => {
    const rounds = c.linescores || [];
    const r1 = rounds[0]?.value ?? null;
    const r2 = rounds[1]?.value ?? null;
    const r3 = rounds[2]?.value ?? null;
    const r4 = rounds[3]?.value ?? null;

    if (r3 !== null && r3 > worstR3) worstR3 = r3;
    if (r4 !== null && r4 > worstR4) worstR4 = r4;

    // Status — ESPN may not always include a status object
    const statusType = c.status?.type?.name || c.status?.name || "";
    let status = "active";
    if (statusType.includes("CUT")) status = "cut";
    else if (statusType.includes("WITHDRAWN") || statusType.includes("WD")) status = "wd";
    else if (statusType.includes("DISQUALIFIED") || statusType.includes("DQ")) status = "dq";

    // Score — can be a string like "-7", "E", "+3" or an object
    const scoreRaw = typeof c.score === "string" ? c.score : c.score?.displayValue || "E";
    let totalToPar = 0;
    if (scoreRaw === "E") totalToPar = 0;
    else totalToPar = parseInt(scoreRaw, 10) || 0;

    return {
      espnId: c.id,
      name: c.athlete?.displayName || "Unknown",
      r1,
      r2,
      r3,
      r4,
      totalToPar,
      status,
      position: String(c.order || c.sortOrder || 0),
    };
  });

  return { scores, worstR3, worstR4 };
}

export async function fetchCurrentEvents() {
  const res = await fetch(`${ESPN_BASE}/scoreboard`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`ESPN API error: ${res.status}`);
  const data = await res.json();

  return (data.events || []).map((e: ESPNEvent) => ({
    espnId: e.id,
    name: e.name,
    date: e.date,
  }));
}
