import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CrmRole } from "@/types";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ complexes: [], users: [] });

  const role = session.user.role as CrmRole;
  const domainFilter = role === "DOMAIN_MANAGER" && session.user.domainId
    ? { domainId: session.user.domainId }
    : role === "AREA_MANAGER"
      ? { assignments: { some: { userId: session.user.id, isActive: true } } }
      : {};

  const [complexes, users] = await Promise.all([
    prisma.crmComplex.findMany({
      where: {
        isActive: true,
        ...domainFilter,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { city: { contains: q, mode: "insensitive" } },
          { address: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, city: true, address: true, domain: { select: { name: true } } },
      take: 6,
    }),
    role !== "AREA_MANAGER"
      ? prisma.crmUser.findMany({
          where: {
            isActive: true,
            OR: [
              { fullName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          },
          select: { id: true, fullName: true, role: true, domain: { select: { name: true } } },
          take: 4,
        })
      : Promise.resolve([]),
  ]);

  return NextResponse.json({ complexes, users });
}
