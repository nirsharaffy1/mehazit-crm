import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addDays } from "date-fns";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role === "AREA_MANAGER")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { deadlineDays } = await req.json();
  const days = Number(deadlineDays);
  if (!days || days < 1) return NextResponse.json({ error: "ימים לא תקינים" }, { status: 400 });

  const assignment = await prisma.crmComplexAssignment.update({
    where: { id },
    data: {
      deadlineDays: days,
      deadlineAt: addDays(new Date(), days),
    },
  });

  return NextResponse.json(assignment);
}
