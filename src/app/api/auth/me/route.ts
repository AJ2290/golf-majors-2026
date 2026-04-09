import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const competitorId = await getSession();
  if (!competitorId) {
    return Response.json({ user: null });
  }

  const competitor = await prisma.competitor.findUnique({
    where: { id: competitorId },
    select: { id: true, name: true, isAdmin: true },
  });

  return Response.json({ user: competitor });
}
