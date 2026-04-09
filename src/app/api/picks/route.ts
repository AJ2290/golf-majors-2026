import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const competitorId = await getSession();
    if (!competitorId) {
      return Response.json({ error: "Not logged in" }, { status: 401 });
    }

    const { tournamentId, picks } = await request.json();
    // picks: [{ slot, golferName }]

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

    // Find or create golfers by name
    const golferIds: string[] = [];
    for (const pick of picks as Array<{ slot: string; golferName: string }>) {
      if (!pick.golferName?.trim()) {
        return Response.json({ error: "All 4 golfer names are required" }, { status: 400 });
      }

      const name = pick.golferName.trim();
      const region = pick.slot.startsWith("eu") ? "EU" : pick.slot === "us" ? "US" : "ROW";

      // Find existing golfer by name
      let golfer = await prisma.golfer.findFirst({
        where: { name },
      });

      // Create if not found
      if (!golfer) {
        golfer = await prisma.golfer.create({
          data: { name, espnId: `manual-${Date.now()}-${Math.random().toString(36).slice(2)}`, region },
        });
      }

      golferIds.push(golfer.id);
    }

    // Check no duplicate golfers within this pick set
    if (new Set(golferIds).size !== golferIds.length) {
      return Response.json({ error: "Cannot pick the same golfer twice" }, { status: 400 });
    }

    // Upsert picks (delete old + create new)
    await prisma.$transaction([
      prisma.pick.deleteMany({ where: { competitorId, tournamentId } }),
      ...picks.map((pick: { slot: string }, i: number) =>
        prisma.pick.create({
          data: { competitorId, tournamentId, golferId: golferIds[i], slot: pick.slot },
        })
      ),
    ]);

    return Response.json({ ok: true });
  } catch (err) {
    console.error("Picks error:", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
