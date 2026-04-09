import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const competitorId = await getSession();
    if (!competitorId) {
      return Response.json({ error: "Not logged in" }, { status: 401 });
    }

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
