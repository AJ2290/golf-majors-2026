import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const competitorId = await getSession();
  if (!competitorId) {
    return Response.json({ error: "Not logged in" }, { status: 401 });
  }

  const golfers = await prisma.golfer.findMany({
    orderBy: { name: "asc" },
  });

  return Response.json({ golfers });
}
