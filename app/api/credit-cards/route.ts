import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export async function GET() {
  const user = await requireUser();
  const cards = await prisma.creditCard.findMany({
    where: { userId: user.id, archived: false },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(cards);
}
