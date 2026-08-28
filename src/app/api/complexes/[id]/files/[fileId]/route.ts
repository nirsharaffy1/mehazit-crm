import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role === "AREA_MANAGER")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { fileId } = await params;
  await prisma.crmComplexFile.delete({ where: { id: fileId } });
  return NextResponse.json({ ok: true });
}
