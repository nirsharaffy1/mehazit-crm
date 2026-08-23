import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CrmRole } from "@/types";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ reminders: 0 });

  const role = session.user.role as CrmRole;
  if (role === "AREA_MANAGER") return NextResponse.json({ reminders: 0 });

  const now = new Date();
  const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const domainFilter =
    role === "DOMAIN_MANAGER" && session.user.domainId
      ? { complex: { domainId: session.user.domainId } }
      : {};

  const reminders = await prisma.crmComplexAssignment.count({
    where: {
      isActive: true,
      deadlineAt: { lt: twoWeeks },
      ...domainFilter,
    },
  });

  return NextResponse.json({ reminders });
}
