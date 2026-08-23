import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ROLE_LABELS } from "@/types";
import { Users, Circle } from "lucide-react";
import { formatRelative } from "@/lib/utils";

export default async function MyTeamPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "DOMAIN_MANAGER") redirect("/dashboard");

  const userId = session.user.id;
  const domainId = session.user.domainId;

  // Find all complexes this manager manages (by domain or direct assignment)
  const managedComplexes = await prisma.crmComplex.findMany({
    where: {
      isActive: true,
      OR: [
        ...(domainId ? [{ domainId }] : []),
        { assignments: { some: { userId, isActive: true } } },
      ],
    },
    select: { id: true },
  });
  const complexIds = managedComplexes.map((c) => c.id);

  // Find all active users assigned to those complexes (exclude self)
  const [teamMembers, weekVisits] = await Promise.all([
    prisma.crmUser.findMany({
      where: {
        isActive: true,
        id: { not: userId },
        assignments: { some: { complexId: { in: complexIds }, isActive: true } },
      },
      include: {
        domain: true,
        assignments: {
          where: { isActive: true, complexId: { in: complexIds } },
          include: { complex: { select: { id: true, name: true } } },
        },
      },
      orderBy: [{ role: "asc" }, { fullName: "asc" }],
    }),
    prisma.crmVisit.groupBy({
      by: ["userId"],
      where: {
        complexId: { in: complexIds },
        visitDate: {
          gte: (() => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); d.setHours(0,0,0,0); return d; })(),
          lt: (() => { const d = new Date(); d.setDate(d.getDate() - d.getDay() + 7); d.setHours(0,0,0,0); return d; })(),
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
          <p className="text-dark/50 dark:text-cream/50">אין חברי צוות מוקצים למתחמים שלך עדיין</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-line">
                <tr className="text-right">
                  <th className="px-4 py-3 text-xs font-medium text-dark/50 dark:text-cream/50">שם</th>
                  <th className="px-4 py-3 text-xs font-medium text-dark/50 dark:text-cream/50 hidden md:table-cell">תפקיד</th>
                  <th className="px-4 py-3 text-xs font-medium text-dark/50 dark:text-cream/50 hidden md:table-cell">מתחמים פעילים</th>
                  <th className="px-4 py-3 text-xs font-medium text-dark/50 dark:text-cream/50">ביקורים השבוע</th>
                  <th className="px-4 py-3 text-xs font-medium text-dark/50 dark:text-cream/50 hidden lg:table-cell">כניסה אחרונה</th>
                  <th className="px-4 py-3 text-xs font-medium text-dark/50 dark:text-cream/50">סטטוס</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {teamMembers.map((u) => (
                  <tr key={u.id} className="hover:bg-offwhite dark:hover:bg-dark-soft transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gold/15 flex items-center justify-center flex-shrink-0">
                          <span className="text-gold text-xs font-bold">{u.fullName.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-medium text-dark dark:text-cream">{u.fullName}</p>
                          {u.phone && <p className="text-xs text-dark/40 dark:text-cream/40">{u.phone}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`badge text-xs ${u.role === "DOMAIN_MANAGER" ? "badge-green" : "badge-gray"}`}>
                        {ROLE_LABELS[u.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="space-y-0.5">
                        {u.assignments.map((a) => (
                          <p key={a.id} className="text-xs text-dark/60 dark:text-cream/60 truncate max-w-[160px]">
                            {a.complex.name}
                          </p>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-semibold ${(visitsByUser[u.id] ?? 0) > 0 ? "text-emerald-500" : "text-dark/30 dark:text-cream/30"}`}>
                        {visitsByUser[u.id] ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-dark/40 dark:text-cream/40 text-xs hidden lg:table-cell">
                      {u.lastLoginAt ? formatRelative(u.lastLoginAt) : "מעולם"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1.5 text-xs ${u.isActive ? "text-emerald-500" : "text-red-500"}`}>
                        <Circle size={8} fill="currentColor" />
                        {u.isActive ? "פעיל" : "מושבת"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
