import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z ]/g, "");
}

export async function POST(request: NextRequest) {
  try {
    const competitorId = await getSession();
    if (!competitorId) {
      return Response.json({ error: "Not logged in" }, { status: 401 });
    }

    const { tournamentId, picks } = await request.json();

    if (!tournamentId || !picks || picks.length !== 4) {
      return Response.json({ error: "Must pick exactly 4 golfers" }, { status: 400 });
    }

    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) {
      return Response.json({ error: "Tournament not found" }, { status: 404 });
    }
    if (tournament.locked || new Date(tournament.deadline) <= new Date()) {
      return Response.json({ error: "Picks are locked for this major" }, { status: 400 });
    }

    const requiredSlots = ["eu1", "eu2", "us", "row"];
    const slots = picks.map((p: { slot: string }) => p.slot);
    if (!requiredSlots.every((s) => slots.includes(s))) {
      return Response.json({ error: "Must fill all 4 slots" }, { status: 400 });
    }

    // Get all golfers in DB for matching
    const allGolfers = await prisma.golfer.findMany();

    const golferIds: string[] = [];
    const golferNames: string[] = [];

    for (const pick of picks as Array<{ slot: string; golferName: string }>) {
      if (!pick.golferName?.trim()) {
        return Response.json({ error: "All 4 golfer names are required" }, { status: 400 });
      }

      const name = pick.golferName.trim();
      const norm = normalize(name);
      const region = pick.slot.startsWith("eu") ? "EU" : pick.slot === "us" ? "US" : "ROW";

      // Try to find existing golfer by name
      let golfer = allGolfers.find((g) => normalize(g.name) === norm);

      // If not found, create one — anyone can be picked
      if (!golfer) {
        golfer = await prisma.golfer.create({
          data: {
            name,
            espnId: `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            region,
          },
        });
        allGolfers.push(golfer);
      }

      golferIds.push(golfer.id);
      golferNames.push(golfer.name);
    }

    // No picking the same golfer twice in one major
    if (new Set(golferIds).size !== golferIds.length) {
      return Response.json({ error: "Cannot pick the same golfer twice" }, { status: 400 });
    }

    // No reusing a golfer across majors
    const existingPicks = await prisma.pick.findMany({
      where: { competitorId, tournamentId: { not: tournamentId } },
      include: { golfer: true, tournament: true },
    });
    for (let i = 0; i < golferIds.length; i++) {
      const clash = existingPicks.find((p) => p.golferId === golferIds[i]);
      if (clash) {
        return Response.json({
          error: `${clash.golfer.name} already picked in ${clash.tournament.name}`,
        }, { status: 400 });
      }
    }

    // Save picks
    await prisma.$transaction([
      prisma.pick.deleteMany({ where: { competitorId, tournamentId } }),
      ...picks.map((pick: { slot: string }, i: number) =>
        prisma.pick.create({
          data: { competitorId, tournamentId, golferId: golferIds[i], slot: pick.slot },
        })
      ),
    ]);

    return Response.json({ ok: true, matched: golferNames });
  } catch (err) {
    console.error("Picks error:", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
