import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role === "AREA_MANAGER")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { assemblyDate, assemblyTime, assemblyLocation } = await req.json();

  const complex = await prisma.crmComplex.update({
    where: { id },
    data: {
      assemblyDate: assemblyDate ? new Date(assemblyDate) : null,
      assemblyTime: assemblyTime ?? null,
      assemblyLocation: assemblyLocation ?? null,
    },
    select: { id: true, assemblyDate: true, assemblyTime: true, assemblyLocation: true },
  });

  return NextResponse.json(complex);
}
