import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z ]/g, "");
}

function fuzzyMatch(input: string, candidates: { id: string; name: string; region: string }[]): { id: string; name: string; region: string } | null {
  const norm = normalize(input);
  if (!norm) return null;

  // Exact match first
  const exact = candidates.find((c) => normalize(c.name) === norm);
  if (exact) return exact;

  // Substring match (input is part of name, or name is part of input)
  const substring = candidates.find((c) => {
    const cn = normalize(c.name);
    return cn.includes(norm) || norm.includes(cn);
  });
  if (substring) return substring;

  // Last name match
  const inputParts = norm.split(" ");
  const inputLast = inputParts[inputParts.length - 1];
  if (inputLast.length >= 3) {
    const lastNameMatches = candidates.filter((c) => {
      const parts = normalize(c.name).split(" ");
      return parts[parts.length - 1] === inputLast;
    });
    if (lastNameMatches.length === 1) return lastNameMatches[0];
  }

  return null;
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

    // Get all synced golfers (real ESPN IDs only)
    const allGolfers = await prisma.golfer.findMany({
      where: { NOT: { espnId: { startsWith: "manual-" } } },
    });

    // Match each pick to a real golfer
    const golferIds: string[] = [];
    const golferNames: string[] = [];

    for (const pick of picks as Array<{ slot: string; golferName: string }>) {
      if (!pick.golferName?.trim()) {
        return Response.json({ error: "All 4 golfer names are required" }, { status: 400 });
      }

      const region = pick.slot.startsWith("eu") ? "EU" : pick.slot === "us" ? "US" : "ROW";

      // Try matching within the correct region first
      const regionGolfers = allGolfers.filter((g) => g.region === region);
      let match = fuzzyMatch(pick.golferName, regionGolfers);

      // If no match in region, try all golfers and suggest the right slot
      if (!match) {
        const anyMatch = fuzzyMatch(pick.golferName, allGolfers);
        if (anyMatch) {
          return Response.json({
            error: `${anyMatch.name} is categorised as ${anyMatch.region}, not ${region}. Move them to the right slot.`,
          }, { status: 400 });
        }
        return Response.json({
          error: `No golfer matching "${pick.golferName}" found. Check the spelling.`,
        }, { status: 400 });
      }

      golferIds.push(match.id);
      golferNames.push(match.name);
    }

    // Check no duplicate golfers within this pick set
    if (new Set(golferIds).size !== golferIds.length) {
      return Response.json({ error: "Cannot pick the same golfer twice" }, { status: 400 });
    }

    // Check no golfer reuse across other majors
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

    // Upsert picks
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
