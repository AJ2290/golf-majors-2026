import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function PATCH(request: NextRequest) {
  const competitorId = await getSession();
  if (!competitorId) {
    return Response.json({ error: "Not logged in" }, { status: 401 });
  }

  const user = await prisma.competitor.findUnique({ where: { id: competitorId } });
  if (!user?.isAdmin) {
    return Response.json({ error: "Admin only" }, { status: 403 });
  }

  const { tournamentId, espnId, deadline, locked } = await request.json();

  if (!tournamentId) {
    return Response.json({ error: "Tournament ID required" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (espnId !== undefined) data.espnId = espnId;
  if (deadline !== undefined) data.deadline = new Date(deadline);
  if (locked !== undefined) data.locked = locked;

  const updated = await prisma.tournament.update({
    where: { id: tournamentId },
    data,
  });

  return Response.json({ ok: true, tournament: updated });
}
