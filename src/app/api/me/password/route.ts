import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { current, next } = await req.json();
  if (!current || !next || next.length < 6)
    return NextResponse.json({ error: "סיסמה חייבת להיות לפחות 6 תווים" }, { status: 400 });

  const user = await prisma.crmUser.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "משתמש לא נמצא" }, { status: 404 });

  const ok = await bcrypt.compare(current, user.passwordHash);
  if (!ok) return NextResponse.json({ error: "הסיסמה הנוכחית שגויה" }, { status: 400 });

  const hash = await bcrypt.hash(next, 12);
  await prisma.crmUser.update({ where: { id: user.id }, data: { passwordHash: hash } });

  return NextResponse.json({ ok: true });
}
