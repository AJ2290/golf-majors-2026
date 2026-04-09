import { prisma } from "./db";
import { MAJORS_2026 } from "./constants";
import { fetchTournamentField } from "./espn";

let seeded = false;

export async function ensureTournaments() {
  if (seeded) return;

  for (const major of MAJORS_2026) {
    const existing = await prisma.tournament.findFirst({
      where: { name: major.name, year: 2026 },
    });

    if (!existing) {
      await prisma.tournament.create({
        data: {
          name: major.name,
          year: 2026,
          espnId: major.espnId,
          deadline: new Date(major.deadline),
        },
      });
    }
  }

  // Sync golfer field for any tournament that has an ESPN ID but no golfers yet
  const tournaments = await prisma.tournament.findMany({ where: { year: 2026 } });
  const golferCount = await prisma.golfer.count();

  if (golferCount === 0) {
    for (const t of tournaments) {
      if (!t.espnId) continue;
      try {
        const field = await fetchTournamentField(t.espnId);
        for (const player of field) {
          const existing = await prisma.golfer.findUnique({ where: { espnId: player.espnId } });
          if (!existing) {
            await prisma.golfer.create({
              data: { espnId: player.espnId, name: player.name, region: player.region },
            });
          }
        }
        break; // One tournament's field is enough to populate golfers
      } catch {
        // ESPN might not have the field yet — that's fine
      }
    }
  }

  seeded = true;
}
