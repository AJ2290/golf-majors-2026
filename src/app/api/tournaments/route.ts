import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const competitorId = await getSession();
  if (!competitorId) {
    return Response.json({ error: "Not logged in" }, { status: 401 });
  }

  const tournaments = await prisma.tournament.findMany({
    orderBy: { deadline: "asc" },
    include: {
      picks: {
        include: {
          golfer: true,
          competitor: { select: { id: true, name: true } },
        },
      },
    },
  });

  // Hide other people's picks for unlocked tournaments
  const now = new Date();
  const sanitised = tournaments.map((t) => {
    const isLocked = t.locked || new Date(t.deadline) <= now;
    return {
      ...t,
      picks: isLocked
        ? t.picks
        : t.picks.filter((p) => p.competitorId === competitorId),
    };
  });

  return Response.json({ tournaments: sanitised });
}
