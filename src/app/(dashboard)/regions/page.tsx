import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import RegionsClient from "@/components/features/RegionsClient";

export default async function RegionsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "GENERAL_ADMIN") redirect("/dashboard");

  const domains = await prisma.crmDomain.findMany({
    include: {
      _count: { select: { users: true, complexes: true } },
      users: {
        where: { role: "DOMAIN_MANAGER", isActive: true },
        select: { id: true, fullName: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-3xl mx-auto w-full">
      <h1 className="page-title">ניהול תחומים</h1>
      <RegionsClient domains={domains} />
    </div>
  );
}
