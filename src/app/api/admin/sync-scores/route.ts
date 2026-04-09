import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { fetchTournamentScores } from "@/lib/espn";

export async function POST() {
  const competitorId = await getSession();
  if (!competitorId) {
    return Response.json({ error: "Not logged in" }, { status: 401 });
  }

  const user = await prisma.competitor.findUnique({ where: { id: competitorId } });
  if (!user?.isAdmin) {
    return Response.json({ error: "Admin only" }, { status: 403 });
  }

  const tournaments = await prisma.tournament.findMany({
    where: { espnId: { not: null } },
  });

  let synced = 0;

  for (const tournament of tournaments) {
    if (!tournament.espnId) continue;

    try {
      const { scores } = await fetchTournamentScores(tournament.espnId);

      for (const score of scores) {
        const golfer = await prisma.golfer.findUnique({
          where: { espnId: score.espnId },
        });
        if (!golfer) continue;

        await prisma.golferScore.upsert({
          where: {
            golferId_tournamentId: {
              golferId: golfer.id,
              tournamentId: tournament.id,
            },
          },
          create: {
            golferId: golfer.id,
            tournamentId: tournament.id,
            round1: score.r1,
            round2: score.r2,
            round3: score.r3,
            round4: score.r4,
            totalToPar: score.totalToPar,
            status: score.status,
            position: score.position,
          },
          update: {
            round1: score.r1,
            round2: score.r2,
            round3: score.r3,
            round4: score.r4,
            totalToPar: score.totalToPar,
            status: score.status,
            position: score.position,
          },
        });
        synced++;
      }
    } catch (err) {
      console.error(`Failed to sync ${tournament.name}:`, err);
    }
  }

  return Response.json({ ok: true, synced });
}
