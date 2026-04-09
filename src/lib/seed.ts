import { prisma } from "./db";
import { MAJORS_2026 } from "./constants";
import { fetchTournamentField } from "./espn";

let seeded = false;

export async function ensureTournaments() {
  if (seeded) return;

  // Create tournaments
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
    } else if (
      (major.espnId && existing.espnId !== major.espnId) ||
      existing.deadline.getTime() !== new Date(major.deadline).getTime()
    ) {
      await prisma.tournament.update({
        where: { id: existing.id },
        data: { espnId: major.espnId, deadline: new Date(major.deadline) },
      });
    }
  }

  // Sync golfer field from ESPN if we have fewer than 50 golfers
  const golferCount = await prisma.golfer.count();
  if (golferCount < 50) {
    for (const major of MAJORS_2026) {
      if (!major.espnId) continue;
      try {
        const field = await fetchTournamentField(major.espnId);
        for (const player of field) {
          const existing = await prisma.golfer.findUnique({ where: { espnId: player.espnId } });
          if (existing) {
            await prisma.golfer.update({
              where: { espnId: player.espnId },
              data: { name: player.name, region: player.region },
            });
          } else {
            await prisma.golfer.create({
              data: { espnId: player.espnId, name: player.name, region: player.region },
            });
          }
        }
        break; // One major's field is enough
      } catch {
        // ESPN might not have the field yet
      }
    }
  }

  seeded = true;
}
