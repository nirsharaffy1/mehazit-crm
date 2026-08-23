import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CrmRole, ENGAGEMENT_LABELS } from "@/types";
import { formatDate, daysRemaining } from "@/lib/utils";
import { BarChart3, Download } from "lucide-react";

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user || session.user.role === "AREA_MANAGER") redirect("/dashboard");

  const role = session.user.role as CrmRole;
  const domainFilter = role === "DOMAIN_MANAGER" && session.user.domainId
    ? { domainId: session.user.domainId }
    : {};

  const [complexes, assignments, visits] = await Promise.all([
    prisma.crmComplex.findMany({
      where: { isActive: true, ...domainFilter },
      include: { domain: true, _count: { select: { visits: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.crmComplexAssignment.findMany({
      where: { isActive: true, complex: domainFilter },
      include: {
        complex: { select: { name: true, city: true } },
        user: { select: { fullName: true } },
      },
      orderBy: { deadlineAt: "asc" },
    }),
    prisma.crmVisit.findMany({
      where: { complex: domainFilter },
      orderBy: { visitDate: "desc" },
      take: 50,
      include: { complex: { select: { name: true } }, user: { select: { fullName: true } } },
    }),
  ]);

  const now = new Date();
  const overdue = assignments.filter(a => daysRemaining(a.deadlineAt) < 0);
  const urgent = assignments.filter(a => { const d = daysRemaining(a.deadlineAt); return d >= 0 && d <= 7; });
  const totalSignatures = visits.reduce((s, v) => s + v.newSignatures, 0);
  const amidorCount = visits.filter(v => v.hasAmidorAmigur).length;

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <h1 className="page-title flex items-center gap-2">
          <BarChart3 size={22} className="text-gold" /> דוחות
        </h1>
        <a href="/api/reports/export" className="btn-ghost text-sm">
          <Download size={15} /> ייצוא Excel
        </a>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "מתחמים", value: complexes.length },
          { label: "הקצאות פעילות", value: assignments.length },
          { label: "חריגות יעד", value: overdue.length },
          { label: "חתימות יפ\"כ", value: totalSignatures },
        ].map(({ label, value }) => (
          <div key={label} className="card p-4 text-center">
            <p className="text-2xl font-display font-semibold text-dark dark:text-cream">{value}</p>
            <p className="muted text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Overdue/urgent */}
      {(overdue.length > 0 || urgent.length > 0) && (
        <div className="card p-4">
          <h2 className="section-title mb-3">חריגות ודחיפויות</h2>
          <div className="space-y-2">
            {[...overdue, ...urgent].map(a => {
              const days = daysRemaining(a.deadlineAt);
              return (
                <div key={a.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-offwhite dark:bg-dark-soft border border-line">
                  <div>
                    <p className="text-sm font-medium text-dark dark:text-cream">{a.complex.name}</p>
                    <p className="text-xs text-dark/40 dark:text-cream/40">{a.complex.city} · {a.user.fullName}</p>
                  </div>
                  <span className={`badge text-xs ${days < 0 ? "badge-red" : "badge-gold"}`}>
                    {days < 0 ? `חרג ב-${Math.abs(days)}י'` : `${days}י' נשאר`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All complexes table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-line">
          <h2 className="section-title">כל המתחמים</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-offwhite dark:bg-dark-soft">
              <tr className="text-right">
                <th className="px-4 py-3 text-xs font-medium text-dark/50 dark:text-cream/50">מתחם</th>
                <th className="px-4 py-3 text-xs font-medium text-dark/50 dark:text-cream/50 hidden md:table-cell">עיר</th>
                <th className="px-4 py-3 text-xs font-medium text-dark/50 dark:text-cream/50 hidden md:table-cell">תחום</th>
                <th className="px-4 py-3 text-xs font-medium text-dark/50 dark:text-cream/50">ביקורים</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {complexes.map(c => (
                <tr key={c.id} className="hover:bg-offwhite dark:hover:bg-dark-soft">
                  <td className="px-4 py-3 font-medium text-dark dark:text-cream">{c.name}</td>
                  <td className="px-4 py-3 text-dark/60 dark:text-cream/60 hidden md:table-cell">{c.city}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {c.domain ? <span className="badge badge-gray text-xs">{c.domain.name}</span> : "—"}
                  </td>
                  <td className="px-4 py-3 text-dark/60 dark:text-cream/60">{c._count.visits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
