import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  const competitorId = await getSession();
  if (!competitorId) {
    return Response.json({ error: "Not logged in" }, { status: 401 });
  }

  const { tournamentId, picks } = await request.json();
  // picks: [{ golferId, slot }] — 4 items: eu1, eu2, us, row

  if (!tournamentId || !picks || picks.length !== 4) {
    return Response.json({ error: "Must pick exactly 4 golfers" }, { status: 400 });
  }

  // Check tournament exists and isn't locked
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
  });
  if (!tournament) {
    return Response.json({ error: "Tournament not found" }, { status: 404 });
  }
  if (tournament.locked || new Date(tournament.deadline) <= new Date()) {
    return Response.json({ error: "Picks are locked for this major" }, { status: 400 });
  }

  // Validate slots
  const slots = picks.map((p: { slot: string }) => p.slot);
  const requiredSlots = ["eu1", "eu2", "us", "row"];
  if (!requiredSlots.every((s) => slots.includes(s))) {
    return Response.json({ error: "Must fill all 4 slots" }, { status: 400 });
  }

  // Get golfer details and validate regions
  const golferIds = picks.map((p: { golferId: string }) => p.golferId);
  const golfers = await prisma.golfer.findMany({
    where: { id: { in: golferIds } },
  });

  const golferMap = new Map(golfers.map((g) => [g.id, g]));

  for (const pick of picks as Array<{ golferId: string; slot: string }>) {
    const golfer = golferMap.get(pick.golferId);
    if (!golfer) {
      return Response.json({ error: `Golfer not found: ${pick.golferId}` }, { status: 400 });
    }
    const expectedRegion = pick.slot.startsWith("eu") ? "EU" : pick.slot === "us" ? "US" : "ROW";
    if (golfer.region !== expectedRegion) {
      return Response.json({
        error: `${golfer.name} is ${golfer.region}, not ${expectedRegion}`,
      }, { status: 400 });
    }
  }

  // Check no golfer reuse across majors
  const existingPicks = await prisma.pick.findMany({
    where: {
      competitorId,
      tournamentId: { not: tournamentId },
    },
    select: { golferId: true, tournament: { select: { name: true } } },
  });

  const usedGolferIds = new Set(existingPicks.map((p) => p.golferId));
  for (const pick of picks as Array<{ golferId: string; slot: string }>) {
    if (usedGolferIds.has(pick.golferId)) {
      const golfer = golferMap.get(pick.golferId);
      const usedIn = existingPicks.find((p) => p.golferId === pick.golferId);
      return Response.json({
        error: `${golfer?.name} already picked in ${usedIn?.tournament.name}`,
      }, { status: 400 });
    }
  }

  // Check no duplicate golfers within this pick set
  if (new Set(golferIds).size !== golferIds.length) {
    return Response.json({ error: "Cannot pick the same golfer twice" }, { status: 400 });
  }

  // Upsert picks (delete old + create new in transaction)
  await prisma.$transaction([
    prisma.pick.deleteMany({
      where: { competitorId, tournamentId },
    }),
    ...picks.map((pick: { golferId: string; slot: string }) =>
      prisma.pick.create({
        data: {
          competitorId,
          tournamentId,
          golferId: pick.golferId,
          slot: pick.slot,
        },
      })
    ),
  ]);

  return Response.json({ ok: true });
}
