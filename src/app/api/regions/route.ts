import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const domains = await prisma.crmDomain.findMany({
    include: { _count: { select: { users: true, complexes: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ domains });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "GENERAL_ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  const domain = await prisma.crmDomain.create({ data: { name } });
  return NextResponse.json({ domain });
}
