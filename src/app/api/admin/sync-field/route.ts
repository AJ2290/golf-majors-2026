import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { fetchTournamentField } from "@/lib/espn";

export async function POST(request: NextRequest) {
  const competitorId = await getSession();
  if (!competitorId) {
    return Response.json({ error: "Not logged in" }, { status: 401 });
  }

  const user = await prisma.competitor.findUnique({ where: { id: competitorId } });
  if (!user?.isAdmin) {
    return Response.json({ error: "Admin only" }, { status: 403 });
  }

  const { espnEventId } = await request.json();
  if (!espnEventId) {
    return Response.json({ error: "ESPN event ID required" }, { status: 400 });
  }

  const field = await fetchTournamentField(espnEventId);

  let created = 0;
  let updated = 0;

  for (const player of field) {
    const existing = await prisma.golfer.findUnique({
      where: { espnId: player.espnId },
    });

    if (existing) {
      await prisma.golfer.update({
        where: { espnId: player.espnId },
        data: { name: player.name, region: player.region },
      });
      updated++;
    } else {
      await prisma.golfer.create({
        data: {
          espnId: player.espnId,
          name: player.name,
          region: player.region,
        },
      });
      created++;
    }
  }

  return Response.json({ ok: true, created, updated, total: field.length });
}
