import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CrmRole } from "@/types";
import { Prisma } from "@prisma/client";
import Link from "next/link";
import { Building2, Plus } from "lucide-react";
import ComplexListClient from "@/components/features/ComplexListClient";

async function getComplexes(role: CrmRole, userId: string, domainId: string | null) {
  if (role === "AREA_MANAGER") {
    const assignments = await prisma.crmComplexAssignment.findMany({
      where: { userId, isActive: true },
      include: {
        complex: { include: { domain: true } },
      },
      orderBy: { deadlineAt: "asc" },
    });
    return { assignments, complexes: null };
  }

  let whereComplex: Prisma.CrmComplexWhereInput = { isActive: true };
  if (role === "DOMAIN_MANAGER") {
    const userDomains = await prisma.crmUser.findUnique({
      where: { id: userId },
      select: { extraDomains: { select: { id: true } } },
    });
    const allDomainIds = [
      ...(domainId ? [domainId] : []),
      ...(userDomains?.extraDomains.map(d => d.id) ?? []),
    ];
    whereComplex = {
      isActive: true,
      OR: [
        ...(allDomainIds.length > 0 ? [{ domainId: { in: allDomainIds } }] : []),
        { assignments: { some: { userId, isActive: true } } },
      ],
    };
  }

  const complexes = await prisma.crmComplex.findMany({
    where: whereComplex,
    include: {
      domain: true,
      assignments: {
        where: { isActive: true },
        include: { user: { select: { fullName: true } } },
        orderBy: { deadlineAt: "asc" },
      },
      _count: { select: { visits: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return { complexes, assignments: null };
}

export default async function ComplexesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as CrmRole;
  const { complexes, assignments } = await getComplexes(role, session.user.id, session.user.domainId);
  const isAreaManager = role === "AREA_MANAGER";

  const isEmpty = isAreaManager
    ? (assignments?.length ?? 0) === 0
    : (complexes?.length ?? 0) === 0;

  const serializedAssignments = assignments?.map((a) => ({
    id: a.id,
    complexId: a.complexId,
    deadlineAt: a.deadlineAt.toISOString(),
    deadlineDays: a.deadlineDays,
    complex: {
      id: a.complex.id,
      name: a.complex.name,
      city: a.complex.city,
      domain: a.complex.domain ? { name: a.complex.domain.name } : null,
    },
  }));

  const serializedComplexes = complexes?.map((c) => ({
    id: c.id,
    name: c.name,
    city: c.city,
    address: c.address,
    phase: c.phase,
    domain: c.domain ? { name: c.domain.name } : null,
    assignments: c.assignments.map((a) => ({
      id: a.id,
      user: { fullName: a.user.fullName },
      deadlineAt: a.deadlineAt.toISOString(),
      deadlineDays: a.deadlineDays,
    })),
    _count: { visits: c._count.visits },
  }));

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <h1 className="page-title">מתחמים</h1>
        {role === "GENERAL_ADMIN" && (
          <Link href="/complexes/new" className="btn-primary text-sm">
            <Plus size={16} /> מתחם חדש
          </Link>
        )}
      </div>

      {isEmpty ? (
        <div className="card p-12 text-center">
          <Building2 size={40} className="text-dark/20 dark:text-cream/20 mx-auto mb-3" />
          <p className="text-dark/50 dark:text-cream/50">
            {isAreaManager ? "אין מתחמים מוקצים אליך כרגע" : "אין מתחמים עדיין"}
          </p>
        </div>
      ) : (
        <ComplexListClient
          complexes={serializedComplexes}
          assignments={serializedAssignments}
          isAreaManager={isAreaManager}
          isAdmin={role === "GENERAL_ADMIN"}
        />
      )}
    </div>
  );
}
