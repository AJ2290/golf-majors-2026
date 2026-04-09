import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
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
      picks: {
        include: {
          golfer: {
            include: {
              scores: true,
            },
          },
        },
      },
    },
  });

  const now = new Date();

  const leaderboard = competitors.map((comp) => {
    let totalScore = 0;
    const majorScores: Record<string, { score: number; picks: Array<{ name: string; score: number; status: string }> }> = {};

    for (const tournament of tournaments) {
      const isRevealed = tournament.locked || new Date(tournament.deadline) <= now;
      const myPicks = tournament.picks.filter((p) => p.competitorId === comp.id);

      if (!isRevealed || myPicks.length === 0) continue;

      // Find worst R3 and R4 in field for missed cut handling
      const allScores = tournament.picks
        .map((p) => p.golfer.scores.find((s) => s.tournamentId === tournament.id))
        .filter(Boolean);

      const worstR3 = Math.max(...allScores.map((s) => s!.round3 ?? 0), 0);
      const worstR4 = Math.max(...allScores.map((s) => s!.round4 ?? 0), 0);

      let majorTotal = 0;
      const pickDetails: Array<{ name: string; score: number; status: string }> = [];

      for (const pick of myPicks) {
        const score = pick.golfer.scores.find((s) => s.tournamentId === tournament.id);
        let golferScore = score?.totalToPar ?? 0;

        // Missed cut handling: R1+R2 + worst R3 + worst R4
        if (score && (score.status === "cut" || score.status === "wd" || score.status === "dq")) {
          const r1 = score.round1 ?? 0;
          const r2 = score.round2 ?? 0;
          // Recalculate: actual R1+R2 over par + worst R3 + worst R4 over par
          golferScore = score.totalToPar ?? (r1 + r2 - 144 + worstR3 - 72 + worstR4 - 72);
        }

        majorTotal += golferScore;
        pickDetails.push({
          name: pick.golfer.name,
          score: golferScore,
          status: score?.status ?? "active",
        });
      }

      majorScores[tournament.name] = { score: majorTotal, picks: pickDetails };
      totalScore += majorTotal;
    }

    return {
      id: comp.id,
      name: comp.name,
      totalScore,
      majors: majorScores,
    };
  });

  leaderboard.sort((a, b) => a.totalScore - b.totalScore);

  return Response.json({ leaderboard, tournaments: tournaments.map((t) => ({ id: t.id, name: t.name, locked: t.locked || new Date(t.deadline) <= now })) });
}
