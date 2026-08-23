import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CrmProjectPhase } from "@prisma/client";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role === "AREA_MANAGER")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { phase } = await req.json() as { phase: CrmProjectPhase };

  const valid: CrmProjectPhase[] = [
    "INITIAL_CONTACT", "SURVEY", "AGREEMENTS", "URBAN_PLAN", "PERMITS", "CONSTRUCTION",
  ];
  if (!valid.includes(phase))
    return NextResponse.json({ error: "Invalid phase" }, { status: 400 });

  const complex = await prisma.crmComplex.update({
    where: { id },
    data: { phase, phaseUpdatedAt: new Date() },
    select: { id: true, phase: true, phaseUpdatedAt: true },
  });

  return NextResponse.json({ complex });
}
