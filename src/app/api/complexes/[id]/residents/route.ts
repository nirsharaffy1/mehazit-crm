import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CrmRole } from "@/types";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const residents = await prisma.crmResidentContact.findMany({
    where: { complexId: id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(residents);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role as CrmRole;
  if (role === "AREA_MANAGER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { fullName, phone, apartment, building, signedPoA, notes } = body;
  if (!fullName?.trim() || !phone?.trim()) {
    return NextResponse.json({ error: "שם ומספר טלפון נדרשים" }, { status: 400 });
  }

  const resident = await prisma.crmResidentContact.create({
    data: {
      complexId: id,
      fullName: fullName.trim(),
      phone: phone.trim(),
      apartment: apartment?.trim() || null,
      building: building?.trim() || null,
      signedPoA: !!signedPoA,
      notes: notes?.trim() || null,
    },
  });

  return NextResponse.json(resident);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { residentId, signedPoA } = body;

  const resident = await prisma.crmResidentContact.update({
    where: { id: residentId, complexId: id },
    data: { signedPoA: !!signedPoA },
  });

  return NextResponse.json(resident);
}
