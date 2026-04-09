import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { fetchTournamentScores } from "@/lib/espn";

const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

async function autoSyncLiveTournaments() {
  const now = Date.now();
  const tournaments = await prisma.tournament.findMany({
    where: { espnId: { not: null } },
  });

  for (const tournament of tournaments) {
    if (!tournament.espnId) continue;
    const deadline = new Date(tournament.deadline).getTime();
    // Only sync if live (past deadline, within 5 days)
    if (now < deadline || now > deadline + 5 * 24 * 60 * 60 * 1000) continue;
    // Skip if synced recently
    if (tournament.lastSyncAt && now - tournament.lastSyncAt.getTime() < SYNC_INTERVAL_MS) continue;

    try {
      const { scores } = await fetchTournamentScores(tournament.espnId);
      for (const score of scores) {
        let golfer = await prisma.golfer.findUnique({ where: { espnId: score.espnId } });
        if (!golfer) {
          const byName = await prisma.golfer.findFirst({ where: { name: score.name } });
          if (byName && byName.espnId.startsWith("pending-")) {
            golfer = await prisma.golfer.update({ where: { id: byName.id }, data: { espnId: score.espnId } });
          }
        }
        if (!golfer) continue;
        await prisma.golferScore.upsert({
          where: { golferId_tournamentId: { golferId: golfer.id, tournamentId: tournament.id } },
          create: { golferId: golfer.id, tournamentId: tournament.id, round1: score.r1, round2: score.r2, round3: score.r3, round4: score.r4, totalToPar: score.totalToPar, status: score.status, position: score.position },
          update: { round1: score.r1, round2: score.r2, round3: score.r3, round4: score.r4, totalToPar: score.totalToPar, status: score.status, position: score.position },
        });
      }
      await prisma.tournament.update({ where: { id: tournament.id }, data: { lastSyncAt: new Date() } });
    } catch (err) {
      console.error(`Auto-sync failed for ${tournament.name}:`, err);
    }
  }
}

export async function GET() {
  try {
    const competitorId = await getSession();
    if (!competitorId) {
      return Response.json({ error: "Not logged in" }, { status: 401 });
    }

    // Auto-sync live tournaments before returning scores
    await autoSyncLiveTournaments();

    const competitors = await prisma.competitor.findMany({
      select: { id: true, name: true },
    });

    const tournaments = await prisma.tournament.findMany({
      orderBy: { deadline: "asc" },
      include: {
        scores: true,
        picks: {
          include: {
            golfer: {
              include: { scores: true },
            },
          },
        },
      },
    });

    const now = new Date();

    const leaderboard = competitors.map((comp) => {
      let totalScore = 0;
      let hasAnyScores = false;
      const majorScores: Record<string, { score: number; picks: Array<{ name: string; score: number; status: string }> }> = {};

      for (const tournament of tournaments) {
        const isRevealed = tournament.locked || new Date(tournament.deadline) <= now;
        const myPicks = tournament.picks.filter((p) => p.competitorId === comp.id);

        if (!isRevealed || myPicks.length === 0) continue;

        // Get ALL scores for this tournament (not just picked golfers)
        const allTournamentScores = tournament.scores;

        // Worst R3 and R4 relative to par from active golfers who completed those rounds
        const activeR3s = allTournamentScores
          .filter((s) => s.status === "active" && s.round3 !== null)
          .map((s) => (s.round3 ?? 72) - 72);
        const activeR4s = allTournamentScores
          .filter((s) => s.status === "active" && s.round4 !== null)
          .map((s) => (s.round4 ?? 72) - 72);

        const worstR3ToPar = activeR3s.length > 0 ? Math.max(...activeR3s) : 0;
        const worstR4ToPar = activeR4s.length > 0 ? Math.max(...activeR4s) : 0;

        let majorTotal = 0;
        const pickDetails: Array<{ name: string; score: number; status: string }> = [];

        for (const pick of myPicks) {
          const score = pick.golfer.scores.find((s) => s.tournamentId === tournament.id);

          if (!score) {
            pickDetails.push({ name: pick.golfer.name, score: 0, status: "pending" });
            continue;
          }

          hasAnyScores = true;
          let golferScore: number;

          if (score.status === "cut" || score.status === "wd" || score.status === "dq") {
            // Missed cut penalty: their R1+R2 to par + worst R3 to par + worst R4 to par
            const r1ToPar = (score.round1 ?? 72) - 72;
            const r2ToPar = (score.round2 ?? 72) - 72;
            golferScore = r1ToPar + r2ToPar + worstR3ToPar + worstR4ToPar;
          } else {
            // Active golfer: use ESPN totalToPar directly
            golferScore = score.totalToPar ?? 0;
          }

          majorTotal += golferScore;
          pickDetails.push({
            name: pick.golfer.name,
            score: golferScore,
            status: score.status,
          });
        }

        majorScores[tournament.name] = { score: majorTotal, picks: pickDetails };
        totalScore += majorTotal;
      }

      return { id: comp.id, name: comp.name, totalScore, majors: majorScores, hasScores: hasAnyScores };
    });

    leaderboard.sort((a, b) => a.totalScore - b.totalScore);

    return Response.json({
      leaderboard,
      tournaments: tournaments.map((t) => ({
        id: t.id,
        name: t.name,
        locked: t.locked || new Date(t.deadline) <= now,
        lastSyncAt: t.lastSyncAt,
      })),
    });
  } catch (err) {
    console.error("Leaderboard error:", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
