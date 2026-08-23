import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ROLE_LABELS } from "@/types";
import { formatRelative } from "@/lib/utils";
import { Users, Circle } from "lucide-react";
import AddUserModal from "@/components/features/AddUserModal";
import WeeklyTargetCell from "@/components/features/WeeklyTargetCell";

function getWeekBounds() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start, end };
}

export default async function UsersPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "GENERAL_ADMIN") redirect("/dashboard");

  const { start, end } = getWeekBounds();

  const [users, weekVisits] = await Promise.all([
    prisma.crmUser.findMany({
      include: { domain: true },
      orderBy: [{ role: "asc" }, { fullName: "asc" }],
    }),
    prisma.crmVisit.groupBy({
      by: ["userId"],
      where: { visitDate: { gte: start, lt: end } },
      _count: { id: true },
    }),
  ]);

  const visitsByUser = new Map(weekVisits.map((v) => [v.userId, v._count.id]));

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <h1 className="page-title">ניהול משתמשים</h1>
        <AddUserModal />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-line">
              <tr className="text-right">
                <th className="px-4 py-3 text-xs font-medium text-dark/50 dark:text-cream/50">שם</th>
                <th className="px-4 py-3 text-xs font-medium text-dark/50 dark:text-cream/50 hidden md:table-cell">אימייל</th>
                <th className="px-4 py-3 text-xs font-medium text-dark/50 dark:text-cream/50">תפקיד</th>
                <th className="px-4 py-3 text-xs font-medium text-dark/50 dark:text-cream/50 hidden md:table-cell">תחום</th>
                <th className="px-4 py-3 text-xs font-medium text-dark/50 dark:text-cream/50 hidden lg:table-cell">יעד שבועי</th>
                <th className="px-4 py-3 text-xs font-medium text-dark/50 dark:text-cream/50 hidden lg:table-cell">כניסה אחרונה</th>
                <th className="px-4 py-3 text-xs font-medium text-dark/50 dark:text-cream/50">סטטוס</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-offwhite dark:hover:bg-dark-soft transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gold/15 flex items-center justify-center flex-shrink-0">
                        <span className="text-gold text-xs font-bold">{u.fullName.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-medium text-dark dark:text-cream">{u.fullName}</p>
                        {u.phone && <p className="text-xs text-dark/40 dark:text-cream/40 md:hidden">{u.phone}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-dark/60 dark:text-cream/60 hidden md:table-cell">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs ${u.role === "GENERAL_ADMIN" ? "badge-gold" : u.role === "DOMAIN_MANAGER" ? "badge-green" : "badge-gray"}`}>
                      {ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-dark/60 dark:text-cream/60 hidden md:table-cell">
                    {u.domain?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {u.role === "AREA_MANAGER" ? (
                      <WeeklyTargetCell
                        userId={u.id}
                        initialTarget={u.weeklyVisitTarget}
                        visitsThisWeek={visitsByUser.get(u.id) ?? 0}
                      />
                    ) : (
                      <span className="text-xs text-dark/20 dark:text-cream/20">—</span>
                    )}
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
    </div>
  );
}
