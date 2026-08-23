import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Users, Circle, Building2 } from "lucide-react";
import { formatRelative } from "@/lib/utils";

export default async function MyTeamPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "DOMAIN_MANAGER") redirect("/dashboard");

  const userId = session.user.id;
  const domainId = session.user.domainId;

  // Get all domain IDs (primary + extra)
  const userWithDomains = await prisma.crmUser.findUnique({
    where: { id: userId },
    select: { extraDomains: { select: { id: true } } },
  });
  const allDomainIds = [
    ...(domainId ? [domainId] : []),
    ...(userWithDomains?.extraDomains.map(d => d.id) ?? []),
  ];

  // All complexes this manager is responsible for
  const [domainComplexIds, assignedComplexIds] = await Promise.all([
    allDomainIds.length > 0
      ? prisma.crmComplex
          .findMany({ where: { domainId: { in: allDomainIds }, isActive: true }, select: { id: true } })
          .then((rows) => rows.map((r) => r.id))
      : Promise.resolve([] as string[]),
    prisma.crmComplexAssignment
      .findMany({ where: { userId, isActive: true }, select: { complexId: true } })
      .then((rows) => rows.map((r) => r.complexId)),
  ]);

  const allComplexIds = [...new Set([...domainComplexIds, ...assignedComplexIds])];

  if (allComplexIds.length === 0) {
    return (
      <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto w-full">
        <h1 className="page-title">הצוות שלי</h1>
        <div className="card p-12 text-center">
          <Users size={40} className="text-dark/20 dark:text-cream/20 mx-auto mb-3" />
          <p className="text-dark/50 dark:text-cream/50">אין מתחמים מנוהלים</p>
          <p className="text-xs text-dark/30 dark:text-cream/30 mt-1">
            כאשר תחום יוקצה לך, תראה כאן את הצוות
          </p>
        </div>
      </div>
    );
  }

  // Find all AREA_MANAGERs assigned (active OR historical) to any of these complexes
  const [teamMembers, weekVisits] = await Promise.all([
    prisma.crmUser.findMany({
      where: {
        isActive: true,
        id: { not: userId },
        role: "AREA_MANAGER",
        assignments: { some: { complexId: { in: allComplexIds } } },
      },
      include: {
        assignments: {
          where: { isActive: true, complexId: { in: allComplexIds } },
          include: { complex: { select: { id: true, name: true } } },
        },
      },
      orderBy: { fullName: "asc" },
    }),
    prisma.crmVisit.groupBy({
      by: ["userId"],
      where: {
        complexId: { in: allComplexIds },
        visitDate: {
          gte: (() => {
            const d = new Date();
            d.setDate(d.getDate() - d.getDay());
            d.setHours(0, 0, 0, 0);
            return d;
          })(),
        },
      },
      _count: { id: true },
    }),
  ]);

  const visitsByUser = Object.fromEntries(weekVisits.map((v) => [v.userId, v._count.id]));

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <h1 className="page-title">הצוות שלי</h1>
        <span className="text-sm text-dark/40 dark:text-cream/40">{teamMembers.length} חברי צוות</span>
      </div>

      {teamMembers.length === 0 ? (
        <div className="card p-12 text-center">
          <Users size={40} className="text-dark/20 dark:text-cream/20 mx-auto mb-3" />
          <p className="text-dark/50 dark:text-cream/50">אין מנהלי איזור מוקצים</p>
          <p className="text-xs text-dark/30 dark:text-cream/30 mt-1">
            שבץ מנהלי איזור למתחמים שלך כדי שיופיעו כאן
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {teamMembers.map((u) => (
            <div key={u.id} className="card p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gold/15 flex items-center justify-center flex-shrink-0">
                    <span className="text-gold text-sm font-bold">{u.fullName.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-dark dark:text-cream">{u.fullName}</p>
                    {u.phone && <p className="text-xs text-dark/40 dark:text-cream/40">{u.phone}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <p className={`text-lg font-bold tabular-nums ${(visitsByUser[u.id] ?? 0) > 0 ? "text-emerald-500" : "text-dark/30 dark:text-cream/30"}`}>
                      {visitsByUser[u.id] ?? 0}
                    </p>
                    <p className="text-xs text-dark/40 dark:text-cream/40">ביקורים השבוע</p>
                  </div>
                  <span className={`flex items-center gap-1.5 text-xs ${u.isActive ? "text-emerald-500" : "text-red-500"}`}>
                    <Circle size={8} fill="currentColor" />
                    {u.isActive ? "פעיל" : "מושבת"}
                  </span>
                </div>
              </div>

              {u.assignments.length > 0 && (
                <div className="mt-3 pt-3 border-t border-line">
                  <p className="text-xs text-dark/40 dark:text-cream/40 mb-2 flex items-center gap-1">
                    <Building2 size={11} /> מתחמים פעילים:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {u.assignments.map((a) => (
                      <span key={a.id} className="badge badge-gray text-xs">
                        {a.complex.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {u.lastLoginAt && (
                <p className="text-xs text-dark/30 dark:text-cream/30 mt-2">
                  כניסה אחרונה: {formatRelative(u.lastLoginAt)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
