import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const competitorId = await getSession();
  if (!competitorId) {
    return Response.json({ error: "Not logged in" }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.toLowerCase().trim();
  const region = request.nextUrl.searchParams.get("region");

  if (!q || q.length < 2) {
    return Response.json({ results: [] });
  }

  const where: Record<string, unknown> = {
    NOT: { espnId: { startsWith: "manual-" } },
  };
  if (region) {
    where.region = region;
  }

  const golfers = await prisma.golfer.findMany({ where, orderBy: { name: "asc" } });

  const matches = golfers
    .filter((g) => g.name.toLowerCase().includes(q))
    .slice(0, 5)
    .map((g) => ({ id: g.id, name: g.name, region: g.region }));

  return Response.json({ results: matches });
}
