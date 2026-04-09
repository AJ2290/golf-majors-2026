export interface TournamentTheme {
  id: string;
  bg: string;
  bgCard: string;
  bgCardHover: string;
  border: string;
  accent: string;
  accentLight: string;
  accentBorder: string;
  text: string;
  muted: string;
  dim: string;
  gradient: string;
  badge: string;
  badgeText: string;
  buttonText: string;
}

// Masters: cream background, Augusta green + gold
export const MASTERS: TournamentTheme = {
  id: "masters",
  bg: "#f5f2ec",
  bgCard: "rgba(22,95,59,0.06)",
  bgCardHover: "rgba(22,95,59,0.10)",
  border: "rgba(22,95,59,0.15)",
  accent: "#165f3b",
  accentLight: "rgba(22,95,59,0.08)",
  accentBorder: "rgba(22,95,59,0.25)",
  text: "#1a2e1a",
  muted: "rgba(26,46,26,0.6)",
  dim: "rgba(26,46,26,0.35)",
  gradient: "linear-gradient(135deg, #f5f2ec 0%, #e8efe6 100%)",
  badge: "rgba(212,175,55,0.12)",
  badgeText: "#b8941e",
  buttonText: "#ffffff",
};

// PGA Championship: light blue-grey, navy + gold
export const PGA: TournamentTheme = {
  id: "pga",
  bg: "#eef2f7",
  bgCard: "rgba(0,51,102,0.05)",
  bgCardHover: "rgba(0,51,102,0.09)",
  border: "rgba(0,51,102,0.12)",
  accent: "#003366",
  accentLight: "rgba(0,51,102,0.07)",
  accentBorder: "rgba(0,51,102,0.20)",
  text: "#1a2333",
  muted: "rgba(26,35,51,0.6)",
  dim: "rgba(26,35,51,0.35)",
  gradient: "linear-gradient(135deg, #eef2f7 0%, #e2e9f0 100%)",
  badge: "rgba(212,175,55,0.12)",
  badgeText: "#b8941e",
  buttonText: "#ffffff",
};

// US Open: white/light grey, red + navy blue
export const USOPEN: TournamentTheme = {
  id: "usopen",
  bg: "#f7f7f7",
  bgCard: "rgba(196,30,58,0.04)",
  bgCardHover: "rgba(196,30,58,0.08)",
  border: "rgba(196,30,58,0.12)",
  accent: "#c41e3a",
  accentLight: "rgba(196,30,58,0.06)",
  accentBorder: "rgba(196,30,58,0.20)",
  text: "#1a1a2e",
  muted: "rgba(26,26,46,0.6)",
  dim: "rgba(26,26,46,0.35)",
  gradient: "linear-gradient(135deg, #f7f7f7 0%, #f0f0f5 100%)",
  badge: "rgba(0,82,204,0.10)",
  badgeText: "#0052cc",
  buttonText: "#ffffff",
};

// The Open: warm off-white, dark navy + claret + yellow
export const THEOPEN: TournamentTheme = {
  id: "open",
  bg: "#faf8f3",
  bgCard: "rgba(26,26,26,0.04)",
  bgCardHover: "rgba(26,26,26,0.07)",
  border: "rgba(26,26,26,0.10)",
  accent: "#1a1a3e",
  accentLight: "rgba(26,26,62,0.06)",
  accentBorder: "rgba(26,26,62,0.18)",
  text: "#1a1a1a",
  muted: "rgba(26,26,26,0.55)",
  dim: "rgba(26,26,26,0.30)",
  gradient: "linear-gradient(135deg, #faf8f3 0%, #f2efe6 100%)",
  badge: "rgba(245,197,24,0.15)",
  badgeText: "#b8910a",
  buttonText: "#ffffff",
};

export const THEMES: Record<string, TournamentTheme> = {
  "The Masters": MASTERS,
  "PGA Championship": PGA,
  "US Open": USOPEN,
  "The Open": THEOPEN,
};

export const DEFAULT_THEME = MASTERS;

export function getTheme(tournamentName: string): TournamentTheme {
  return THEMES[tournamentName] || DEFAULT_THEME;
}

export const TOURNAMENT_META: Record<string, { emoji: string; venue: string; location: string; logo: string }> = {
  "The Masters": { emoji: "🌺", venue: "Augusta National GC", location: "Augusta, Georgia", logo: "/masters-logo.png" },
  "PGA Championship": { emoji: "⚡", venue: "Aronimink Golf Club", location: "Newtown Square, Pennsylvania", logo: "/pga-logo.png" },
  "US Open": { emoji: "🇺🇸", venue: "Shinnecock Hills GC", location: "Southampton, New York", logo: "/usopen-logo.png" },
  "The Open": { emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", venue: "Royal Birkdale", location: "Southport, England", logo: "/theopen-logo.png" },
};
