import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const files = await prisma.crmComplexFile.findMany({
    where: { complexId: id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ files });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role === "AREA_MANAGER")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { name, url, fileType } = await req.json();
  if (!name || !url) return NextResponse.json({ error: "שם וקישור הם שדות חובה" }, { status: 400 });

  const file = await prisma.crmComplexFile.create({
    data: { complexId: id, name, url, fileType: fileType ?? null, uploadedById: session.user.id },
  });
  return NextResponse.json({ file });
}
