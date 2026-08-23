import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const visit = await prisma.crmVisit.create({
    data: {
      complexId: body.complexId,
      userId: session.user.id,
      visitDate: new Date(body.visitDate),
      engagement: body.engagement,
      residentsMetCount: body.residentsMetCount ? Number(body.residentsMetCount) : null,
      newSignatures: Number(body.newSignatures ?? 0),
      hasAmidorAmigur: Boolean(body.hasAmidorAmigur),
      notes: body.notes || null,
      nextVisitDate: body.nextVisitDate ? new Date(body.nextVisitDate) : null,
      fileUrls: body.fileUrls ?? [],
    },
  });

  await prisma.crmActivityLog.create({
    data: { userId: session.user.id, action: "VISIT_ADDED", metadata: { visitId: visit.id, complexId: body.complexId } },
  });

  return NextResponse.json({ visit });
}
