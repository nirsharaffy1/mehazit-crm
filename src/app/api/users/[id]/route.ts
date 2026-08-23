import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "GENERAL_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { weeklyVisitTarget } = body;

  const user = await prisma.crmUser.update({
    where: { id },
    data: { weeklyVisitTarget: Math.max(0, parseInt(weeklyVisitTarget ?? "0", 10)) },
  });

  return NextResponse.json(user);
}
