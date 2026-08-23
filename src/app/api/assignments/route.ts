import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addDays } from "date-fns";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role === "AREA_MANAGER")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { complexId, userIds, deadlineDays, note } = body as {
    complexId: string;
    userIds: string[];
    deadlineDays: number;
    note?: string;
  };

  if (!Array.isArray(userIds) || userIds.length === 0)
    return NextResponse.json({ error: "יש לבחור לפחות מנהל אחד" }, { status: 400 });

  await prisma.crmComplexAssignment.updateMany({
    where: { complexId, isActive: true },
    data: { isActive: false },
  });

  const deadline = addDays(new Date(), Number(deadlineDays));

  const assignments = await Promise.all(
    userIds.map((userId) =>
      prisma.crmComplexAssignment.create({
        data: {
          complexId,
          userId,
          assignedById: session.user.id,
          deadlineDays: Number(deadlineDays),
          deadlineAt: deadline,
          note: note || null,
        },
        include: {
          user: { select: { fullName: true, phone: true } },
          complex: { select: { city: true, name: true } },
        },
      })
    )
  );

  await prisma.crmActivityLog.create({
    data: {
      userId: session.user.id,
      action: "COMPLEX_ASSIGNED",
      metadata: { complexId, assignedTo: userIds, deadlineDays },
    },
  });

  return NextResponse.json({
    assignments,
    city: assignments[0]?.complex.city ?? "",
  });
}
