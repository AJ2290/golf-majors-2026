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
}

export const THEMES: Record<string, TournamentTheme> = {
  "The Masters": {
    id: "masters",
    bg: "#09170e",
    bgCard: "rgba(255,255,255,0.04)",
    bgCardHover: "rgba(255,255,255,0.07)",
    border: "rgba(201,164,85,0.2)",
    accent: "#c9a455",
    accentLight: "rgba(201,164,85,0.15)",
    accentBorder: "rgba(201,164,85,0.35)",
    text: "#f2ead8",
    muted: "rgba(242,234,216,0.5)",
    dim: "rgba(242,234,216,0.3)",
    gradient: "linear-gradient(135deg, #09170e 0%, #0f2517 100%)",
    badge: "rgba(201,164,85,0.15)",
    badgeText: "#c9a455",
  },
  "PGA Championship": {
    id: "pga",
    bg: "#0a1228",
    bgCard: "rgba(255,255,255,0.04)",
    bgCardHover: "rgba(255,255,255,0.07)",
    border: "rgba(212,175,55,0.2)",
    accent: "#d4af37",
    accentLight: "rgba(212,175,55,0.15)",
    accentBorder: "rgba(212,175,55,0.35)",
    text: "#e8eaf0",
    muted: "rgba(232,234,240,0.5)",
    dim: "rgba(232,234,240,0.3)",
    gradient: "linear-gradient(135deg, #0a1228 0%, #142040 100%)",
    badge: "rgba(212,175,55,0.15)",
    badgeText: "#d4af37",
  },
  "US Open": {
    id: "usopen",
    bg: "#001a3a",
    bgCard: "rgba(255,255,255,0.05)",
    bgCardHover: "rgba(255,255,255,0.08)",
    border: "rgba(196,30,58,0.25)",
    accent: "#c41e3a",
    accentLight: "rgba(196,30,58,0.15)",
    accentBorder: "rgba(196,30,58,0.35)",
    text: "#f0f0f0",
    muted: "rgba(240,240,240,0.5)",
    dim: "rgba(240,240,240,0.3)",
    gradient: "linear-gradient(135deg, #001a3a 0%, #002855 100%)",
    badge: "rgba(196,30,58,0.15)",
    badgeText: "#e85d75",
  },
  "The Open": {
    id: "open",
    bg: "#1a1a2e",
    bgCard: "rgba(255,255,255,0.04)",
    bgCardHover: "rgba(255,255,255,0.07)",
    border: "rgba(245,197,24,0.2)",
    accent: "#f5c518",
    accentLight: "rgba(245,197,24,0.12)",
    accentBorder: "rgba(245,197,24,0.35)",
    text: "#f0ece0",
    muted: "rgba(240,236,224,0.5)",
    dim: "rgba(240,236,224,0.3)",
    gradient: "linear-gradient(135deg, #1a1a2e 0%, #2a2a40 100%)",
    badge: "rgba(245,197,24,0.12)",
    badgeText: "#f5c518",
  },
};

// Default theme for non-tournament views (Masters-inspired since it's first)
export const DEFAULT_THEME = THEMES["The Masters"];

export function getTheme(tournamentName: string): TournamentTheme {
  return THEMES[tournamentName] || DEFAULT_THEME;
}

// Tournament metadata for display
export const TOURNAMENT_META: Record<string, { emoji: string; venue: string; location: string }> = {
  "The Masters": { emoji: "🌺", venue: "Augusta National GC", location: "Augusta, Georgia" },
  "PGA Championship": { emoji: "⚡", venue: "Aronimink Golf Club", location: "Newtown Square, Pennsylvania" },
  "US Open": { emoji: "🇺🇸", venue: "Shinnecock Hills GC", location: "Southampton, New York" },
  "The Open": { emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", venue: "Royal Birkdale", location: "Southport, England" },
};
