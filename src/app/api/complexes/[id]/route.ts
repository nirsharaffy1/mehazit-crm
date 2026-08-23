import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "GENERAL_ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.crmComplex.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "GENERAL_ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const complex = await prisma.crmComplex.update({
    where: { id },
    data: {
      name: body.name,
      address: body.address,
      city: body.city,
      domainId: body.domainId || null,
      gush: body.gush || null,
      helka: body.helka || null,
      unitCount: body.unitCount ? Number(body.unitCount) : null,
      buildingCount: body.buildingCount ? Number(body.buildingCount) : null,
      developerName: body.developerName || null,
      description: body.description || null,
      lat: body.lat ? parseFloat(body.lat) : null,
      lng: body.lng ? parseFloat(body.lng) : null,
    },
  });

  return NextResponse.json({ complex });
}
