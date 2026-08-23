import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addDays } from "date-fns";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role === "AREA_MANAGER")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { complexId, userId, deadlineDays, note } = body;

  // Deactivate existing active assignment
  await prisma.crmComplexAssignment.updateMany({
    where: { complexId, isActive: true },
    data: { isActive: false },
  });

  const assignment = await prisma.crmComplexAssignment.create({
    data: {
      complexId,
      userId,
      assignedById: session.user.id,
      deadlineDays: Number(deadlineDays),
      deadlineAt: addDays(new Date(), Number(deadlineDays)),
      note: note || null,
    },
    include: { complex: { select: { city: true, name: true } } },
  });

  await prisma.crmActivityLog.create({
    data: {
      userId: session.user.id,
      action: "COMPLEX_ASSIGNED",
      metadata: { complexId, assignedTo: userId, deadlineDays },
    },
  });

  return NextResponse.json({ assignment, city: assignment.complex.city });
}
