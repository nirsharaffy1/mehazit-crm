import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatDate, formatRelative } from "@/lib/utils";
import { ROLE_LABELS, CrmRole } from "@/types";
import { Activity } from "lucide-react";

const ACTION_LABELS: Record<string, string> = {
  LOGIN: "כניסה למערכת",
  COMPLEX_CREATED: "יצר מתחם",
  COMPLEX_ASSIGNED: "הקצה מתחם",
  VISIT_ADDED: "רשם ביקור",
  USER_CREATED: "יצר משתמש",
};

export default async function ActivityPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "GENERAL_ADMIN") redirect("/dashboard");

  const [logs, sessions] = await Promise.all([
    prisma.crmActivityLog.findMany({
      take: 100,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { fullName: true, role: true } } },
    }),
    prisma.crmSession.groupBy({
      by: ["userId"],
      _sum: { durationSeconds: true },
      _count: { id: true },
    }),
  ]);

  const userMap = await prisma.crmUser.findMany({
    where: { id: { in: sessions.map(s => s.userId) } },
    select: { id: true, fullName: true, role: true },
  });

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto w-full">
      <h1 className="page-title flex items-center gap-2">
        <Activity size={22} className="text-gold" /> יומן פעילות
      </h1>

      {/* Session summary */}
      <div className="card p-4">
        <h2 className="section-title mb-3">זמן שהייה לפי משתמש</h2>
        <div className="space-y-2">
          {sessions.map(s => {
            const u = userMap.find(u => u.id === s.userId);
            const mins = Math.round((s._sum.durationSeconds ?? 0) / 60);
            return (
              <div key={s.userId} className="flex items-center justify-between py-1.5 border-b border-line last:border-0">
                <div>
                  <p className="text-sm font-medium text-dark dark:text-cream">{u?.fullName ?? "—"}</p>
                  <p className="text-xs text-dark/40 dark:text-cream/40">{u ? ROLE_LABELS[u.role as CrmRole] : ""}</p>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-dark dark:text-cream">{mins > 60 ? `${Math.round(mins/60)}ש'` : `${mins}ד'`}</p>
                  <p className="text-xs text-dark/40 dark:text-cream/40">{s._count.id} כניסות</p>
                </div>
              </div>
            );
          })}
          {sessions.length === 0 && <p className="muted text-center py-4">אין נתוני שהייה</p>}
        </div>
      </div>

      {/* Activity log */}
      <div className="card p-4">
        <h2 className="section-title mb-3">לוג פעילות (100 אחרונות)</h2>
        <div className="space-y-1">
          {logs.map(log => (
            <div key={log.id} className="flex items-center gap-3 py-2 border-b border-line last:border-0">
              <div className="w-7 h-7 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                <span className="text-gold text-xs font-bold">{log.user.fullName.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-dark dark:text-cream">
                  <span className="font-medium">{log.user.fullName}</span>{" "}
                  <span className="text-dark/60 dark:text-cream/60">{ACTION_LABELS[log.action] ?? log.action}</span>
                </p>
              </div>
              <p className="text-xs text-dark/40 dark:text-cream/40 flex-shrink-0">{formatRelative(log.createdAt)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
