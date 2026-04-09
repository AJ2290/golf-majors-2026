import { prisma } from "@/lib/db";
import { fetchTournamentScores } from "@/lib/espn";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tournaments = await prisma.tournament.findMany({
    where: { espnId: { not: null } },
  });

  let synced = 0;

  for (const tournament of tournaments) {
    if (!tournament.espnId) continue;

    // Only sync tournaments that are live (past deadline, within 5 days)
    const deadline = new Date(tournament.deadline).getTime();
    const now = Date.now();
    if (now < deadline || now > deadline + 5 * 24 * 60 * 60 * 1000) continue;

    try {
      const { scores } = await fetchTournamentScores(tournament.espnId);

      for (const score of scores) {
        let golfer = await prisma.golfer.findUnique({
          where: { espnId: score.espnId },
        });

        if (!golfer) {
          const byName = await prisma.golfer.findFirst({
            where: { name: score.name },
          });
          if (byName && byName.espnId.startsWith("pending-")) {
            golfer = await prisma.golfer.update({
              where: { id: byName.id },
              data: { espnId: score.espnId },
            });
          }
        }

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

      await prisma.tournament.update({
        where: { id: tournament.id },
        data: { lastSyncAt: new Date() },
      });
    } catch (err) {
      console.error(`Cron: Failed to sync ${tournament.name}:`, err);
    }
  }

  return Response.json({ ok: true, synced });
}
