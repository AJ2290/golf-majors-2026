export const COMPETITORS = ["Ross", "Euan", "AJ", "Ryan", "Sam", "Stuart"];

export const MAJORS_2026 = [
  { name: "The Masters", deadline: "2026-04-09T15:00:00Z", espnId: "401811941" },
  { name: "PGA Championship", deadline: "2026-05-14T15:00:00Z", espnId: "401811947" },
  { name: "US Open", deadline: "2026-06-18T15:00:00Z", espnId: "401811952" },
  { name: "The Open", deadline: "2026-07-16T09:35:00Z", espnId: "401811957" },
];

export const SLOTS = [
  { key: "eu1", label: "European 1", region: "EU" },
  { key: "eu2", label: "European 2", region: "EU" },
  { key: "us", label: "American", region: "US" },
  { key: "row", label: "Rest of World", region: "ROW" },
] as const;
