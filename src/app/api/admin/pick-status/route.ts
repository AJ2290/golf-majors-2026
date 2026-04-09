import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const competitorId = await getSession();
  if (!competitorId) {
    return Response.json({ error: "Not logged in" }, { status: 401 });
  }

  const user = await prisma.competitor.findUnique({ where: { id: competitorId } });
  if (!user?.isAdmin) {
    return Response.json({ error: "Admin only" }, { status: 403 });
  }

  const competitors = await prisma.competitor.findMany({
    select: { id: true, name: true },
  });

  const tournaments = await prisma.tournament.findMany({
    orderBy: { deadline: "asc" },
    select: { id: true, name: true },
  });

  const picks = await prisma.pick.groupBy({
    by: ["competitorId", "tournamentId"],
    _count: { id: true },
  });

  // Build a map: { competitorId: { tournamentId: pickCount } }
  const pickMap = new Map<string, Map<string, number>>();
  for (const p of picks) {
    if (!pickMap.has(p.competitorId)) pickMap.set(p.competitorId, new Map());
    pickMap.get(p.competitorId)!.set(p.tournamentId, p._count.id);
  }

  const status = competitors.map((c) => ({
    name: c.name,
    tournaments: tournaments.map((t) => ({
      tournamentId: t.id,
      tournamentName: t.name,
      pickCount: pickMap.get(c.id)?.get(t.id) ?? 0,
      complete: (pickMap.get(c.id)?.get(t.id) ?? 0) === 4,
    })),
  }));

  return Response.json({ status });
}
