import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { MAJORS_2026 } from "@/lib/constants";

export async function POST() {
  const competitorId = await getSession();
  if (!competitorId) {
    return Response.json({ error: "Not logged in" }, { status: 401 });
  }

  const user = await prisma.competitor.findUnique({ where: { id: competitorId } });
  if (!user?.isAdmin) {
    return Response.json({ error: "Admin only" }, { status: 403 });
  }

  const created = [];

  for (const major of MAJORS_2026) {
    const existing = await prisma.tournament.findUnique({
      where: { name_year: { name: major.name, year: 2026 } },
    });

    if (!existing) {
      const t = await prisma.tournament.create({
        data: {
          name: major.name,
          year: 2026,
          espnId: major.espnId || null,
          deadline: new Date(major.deadline),
        },
      });
      created.push(t.name);
    }
  }

  return Response.json({ ok: true, created });
}
