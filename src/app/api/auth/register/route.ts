import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { COMPETITORS } from "@/lib/constants";
import bcrypt from "bcryptjs";
import { setSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  const { name, pin } = await request.json();

  if (!name || !pin) {
    return Response.json({ error: "Name and PIN required" }, { status: 400 });
  }

  if (!COMPETITORS.includes(name)) {
    return Response.json({ error: "Name not in the competition" }, { status: 400 });
  }

  if (pin.length < 4) {
    return Response.json({ error: "PIN must be at least 4 digits" }, { status: 400 });
  }

  const existing = await prisma.competitor.findUnique({ where: { name } });
  if (existing) {
    return Response.json({ error: "Name already registered. Use login instead." }, { status: 400 });
  }

  const hashedPin = await bcrypt.hash(pin, 10);
  const competitor = await prisma.competitor.create({
    data: {
      name,
      pin: hashedPin,
      isAdmin: name === "AJ",
    },
  });

  await setSession(competitor.id);

  return Response.json({ id: competitor.id, name: competitor.name });
}
