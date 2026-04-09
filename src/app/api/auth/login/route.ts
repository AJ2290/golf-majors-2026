import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { setSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  const { name, pin } = await request.json();

  if (!name || !pin) {
    return Response.json({ error: "Name and PIN required" }, { status: 400 });
  }

  const competitor = await prisma.competitor.findUnique({ where: { name } });
  if (!competitor) {
    return Response.json({ error: "Not registered. Register first." }, { status: 400 });
  }

  const valid = await bcrypt.compare(pin, competitor.pin);
  if (!valid) {
    return Response.json({ error: "Wrong PIN" }, { status: 401 });
  }

  await setSession(competitor.id);

  return Response.json({ id: competitor.id, name: competitor.name });
}
