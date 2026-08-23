import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { CrmRole } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = req.nextUrl.searchParams.get("role") as CrmRole | null;
  const roles = req.nextUrl.searchParams.get("roles");
  const roleFilter = roles
    ? { role: { in: roles.split(",") as CrmRole[] } }
    : role ? { role } : {};
  const users = await prisma.crmUser.findMany({
    where: { isActive: true, ...roleFilter },
    select: { id: true, fullName: true, email: true, role: true, phone: true, domainId: true, domain: { select: { name: true } }, lastLoginAt: true, createdAt: true },
    orderBy: { fullName: "asc" },
  });
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "GENERAL_ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const hash = await bcrypt.hash(body.password, 12);

  const user = await prisma.crmUser.create({
    data: {
      email: body.email,
      passwordHash: hash,
      fullName: body.fullName,
      phone: body.phone || null,
      role: body.role,
      domainId: body.domainId || null,
    },
  });

  await prisma.crmActivityLog.create({
    data: { userId: session.user.id, action: "USER_CREATED", metadata: { newUserId: user.id, role: user.role } },
  });

  return NextResponse.json({ user: { id: user.id, email: user.email, fullName: user.fullName } });
}
