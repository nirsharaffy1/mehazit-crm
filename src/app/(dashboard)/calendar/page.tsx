import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CrmRole } from "@/types";
import CalendarClient from "@/components/features/CalendarClient";

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ month?: string; year?: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as CrmRole;
  const { month: monthParam, year: yearParam } = await searchParams;

  const now = new Date();
  const year = parseInt(yearParam ?? String(now.getFullYear()), 10);
  const month = parseInt(monthParam ?? String(now.getMonth() + 1), 10);

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  const domainFilter = role === "DOMAIN_MANAGER" && session.user.domainId
    ? { complex: { domainId: session.user.domainId } }
    : role === "AREA_MANAGER"
      ? { userId: session.user.id }
      : {};

  const visits = await prisma.crmVisit.findMany({
    where: {
      ...domainFilter,
      OR: [
        { visitDate: { gte: start, lte: end } },
        { nextVisitDate: { gte: start, lte: end } },
      ],
    },
    include: {
      complex: { select: { id: true, name: true, city: true } },
      user: { select: { fullName: true } },
    },
    orderBy: { visitDate: "asc" },
  });

  const serialized = visits.map((v) => ({
    id: v.id,
    visitDate: v.visitDate.toISOString(),
    nextVisitDate: v.nextVisitDate ? v.nextVisitDate.toISOString() : null,
    complexId: v.complex.id,
    complexName: v.complex.name,
    city: v.complex.city,
    managerName: v.user.fullName,
    engagement: v.engagement,
  }));

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto w-full">
      <h1 className="page-title mb-5">לוח שנה</h1>
      <CalendarClient visits={serialized} year={year} month={month} />
    </div>
  );
}
