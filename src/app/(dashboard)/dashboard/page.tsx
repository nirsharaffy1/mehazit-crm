import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CrmRole } from "@/types";
import { daysRemaining, deadlineColor, formatDate } from "@/lib/utils";
import {
  Building2, Users, AlertTriangle, CheckCircle2,
  Clock, TrendingUp, Activity, Heart, Bell
} from "lucide-react";
import Link from "next/link";

function getWeekStart(weeksAgo: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay() - weeksAgo * 7);
  return d;
}

async function getStats(role: CrmRole, userId: string, domainId: string | null) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  if (role === "GENERAL_ADMIN") {
    const [
      totalComplexes, totalUsers, activeAssignments, overdueAssignments,
      totalVisits, recentActivity, visitsPerWeek, recentVisitComplexIds,
    ] = await Promise.all([
      prisma.crmComplex.count({ where: { isActive: true } }),
      prisma.crmUser.count({ where: { isActive: true } }),
      prisma.crmComplexAssignment.count({ where: { isActive: true } }),
      prisma.crmComplexAssignment.count({ where: { isActive: true, deadlineAt: { lt: now } } }),
      prisma.crmVisit.count(),
      prisma.crmActivityLog.findMany({
        take: 8, orderBy: { createdAt: "desc" },
        include: { user: { select: { fullName: true, role: true } } },
      }),
      // Last 8 weeks visit counts
      Promise.all(
        Array.from({ length: 8 }, (_, i) => {
          const weekStart = getWeekStart(7 - i);
          const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
          return prisma.crmVisit.count({ where: { visitDate: { gte: weekStart, lt: weekEnd } } });
        })
      ),
      prisma.crmVisit.findMany({
        where: { visitDate: { gte: thirtyDaysAgo } },
        select: { complexId: true },
        distinct: ["complexId"],
      }).then((vs) => vs.map((v) => v.complexId)),
    ]);

    const onTimeAssignments = activeAssignments - overdueAssignments;
    const complexesWithVisit = recentVisitComplexIds.length;
    const healthScore = totalComplexes === 0 ? 100 :
      Math.round(
        (activeAssignments === 0 ? 50 : (onTimeAssignments / activeAssignments) * 50) +
        (complexesWithVisit / totalComplexes) * 50
      );

    return {
      totalComplexes, totalUsers, activeAssignments, overdueAssignments, totalVisits,
      recentActivity, visitsPerWeek, healthScore, role: "GENERAL_ADMIN" as const,
    };
  }

  if (role === "DOMAIN_MANAGER") {
    // Get all domain IDs this manager is responsible for (primary + extra)
    const userDomains = await prisma.crmUser.findUnique({
      where: { id: userId },
      select: { extraDomains: { select: { id: true } } },
    });
    const allDomainIds = [
      ...(domainId ? [domainId] : []),
      ...(userDomains?.extraDomains.map(d => d.id) ?? []),
    ];

    const complexOR = [
      ...(allDomainIds.length > 0 ? [{ domainId: { in: allDomainIds } }] : []),
      { assignments: { some: { userId, isActive: true } } },
    ];
    const assignmentOR = [
      ...(allDomainIds.length > 0 ? [{ complex: { domainId: { in: allDomainIds } } }] : []),
      { userId },
    ];
    const visitComplexOR = [
      ...(allDomainIds.length > 0 ? [{ domainId: { in: allDomainIds } }] : []),
      { assignments: { some: { userId } } },
    ];

    const [
      myComplexes, myAssignments, overdueAssignments, urgentAssignments,
      visitsPerWeek, recentVisitComplexIds, needsAttention,
    ] = await Promise.all([
      prisma.crmComplex.count({ where: { isActive: true, OR: complexOR } }),
      prisma.crmComplexAssignment.findMany({
        where: { isActive: true, OR: assignmentOR },
        include: { complex: true, user: { select: { fullName: true } } },
        orderBy: { deadlineAt: "asc" }, take: 8,
      }),
      prisma.crmComplexAssignment.count({
        where: { isActive: true, deadlineAt: { lt: now }, OR: assignmentOR },
      }),
      prisma.crmComplexAssignment.count({
        where: {
          isActive: true,
          deadlineAt: { gt: now, lt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
          OR: assignmentOR,
        },
      }),
      Promise.all(
        Array.from({ length: 8 }, (_, i) => {
          const weekStart = getWeekStart(7 - i);
          const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
          return prisma.crmVisit.count({
            where: { visitDate: { gte: weekStart, lt: weekEnd }, complex: { OR: visitComplexOR } },
          });
        })
      ),
      prisma.crmVisit.findMany({
        where: { visitDate: { gte: thirtyDaysAgo }, complex: { OR: visitComplexOR } },
        select: { complexId: true }, distinct: ["complexId"],
      }).then((vs) => vs.map((v) => v.complexId)),
      prisma.crmComplexAssignment.findMany({
        where: { isActive: true, deadlineAt: { lt: now }, OR: assignmentOR },
        include: { complex: { select: { id: true, name: true, city: true } } },
        take: 5,
        orderBy: { deadlineAt: "asc" },
      }),
    ]);

    const onTime = myAssignments.length - overdueAssignments;
    const healthScore = myAssignments.length === 0 ? 100 :
      Math.round((onTime / myAssignments.length) * 50 + (recentVisitComplexIds.length / Math.max(myComplexes, 1)) * 50);

    return {
      myComplexes, myAssignments, overdueAssignments, urgentAssignments,
      visitsPerWeek, healthScore, needsAttention, role: "DOMAIN_MANAGER" as const,
    };
  }

  const [myAssignments, recentVisits] = await Promise.all([
    prisma.crmComplexAssignment.findMany({
      where: { userId, isActive: true },
      include: { complex: { select: { id: true, name: true, city: true } } },
      orderBy: { deadlineAt: "asc" },
    }),
    prisma.crmVisit.findMany({
      where: { userId },
      include: { complex: { select: { name: true } } },
      orderBy: { createdAt: "desc" }, take: 5,
    }),
  ]);
  return { myAssignments, recentVisits, role: "AREA_MANAGER" as const };
}

const ACTION_LABELS: Record<string, string> = {
  LOGIN: "התחבר למערכת",
  COMPLEX_CREATED: "יצר מתחם חדש",
  COMPLEX_ASSIGNED: "הקצה מתחם",
  VISIT_ADDED: "רשם ביקור",
  USER_CREATED: "יצר משתמש",
};

function VisitsChart({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const labels = Array.from({ length: 8 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() - (7 - i) * 7);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  });

  return (
    <div>
      <div className="flex items-end gap-1.5 h-28">
        {data.map((count, i) => {
          const h = Math.round((count / max) * 100);
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] text-dark/40 dark:text-cream/40">{count || ""}</span>
              <div
                className="w-full rounded-t bg-gold/60 hover:bg-gold transition-colors"
                style={{ height: `${Math.max(h, count > 0 ? 4 : 0)}%`, minHeight: count > 0 ? 4 : 0 }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-1.5 mt-1">
        {labels.map((l, i) => (
          <div key={i} className="flex-1 text-center text-[9px] text-dark/30 dark:text-cream/30">{l}</div>
        ))}
      </div>
    </div>
  );
}

function HealthScore({ score }: { score: number }) {
  const color = score >= 75 ? "text-emerald-500" : score >= 50 ? "text-amber-500" : "text-red-500";
  const ringColor = score >= 75 ? "stroke-emerald-500" : score >= 50 ? "stroke-amber-500" : "stroke-red-500";
  const circumference = 2 * Math.PI * 30;
  const dash = (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20">
        <svg viewBox="0 0 70 70" className="w-full h-full -rotate-90">
          <circle cx="35" cy="35" r="30" fill="none" stroke="currentColor" strokeWidth="6" className="text-dark/10 dark:text-cream/10" />
          <circle cx="35" cy="35" r="30" fill="none" strokeWidth="6" strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`} className={ringColor} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-lg font-bold tabular-nums ${color}`}>{score}</span>
        </div>
      </div>
      <p className="text-xs text-dark/50 dark:text-cream/50">ציון בריאות</p>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const stats = await getStats(session.user.role as CrmRole, session.user.id, session.user.domainId);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "בוקר טוב" : hour < 17 ? "צהריים טובים" : "ערב טוב";

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto w-full">
      <div>
        <h1 className="page-title">{greeting}, {session.user.name?.split(" ")[0]}</h1>
        <p className="muted mt-0.5">{formatDate(new Date())}</p>
      </div>

      {stats.role === "GENERAL_ADMIN" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={<Building2 size={20} />} label="מתחמים פעילים" value={stats.totalComplexes} color="gold" />
            <StatCard icon={<Users size={20} />} label="משתמשים" value={stats.totalUsers} color="blue" />
            <StatCard icon={<Clock size={20} />} label="הקצאות פעילות" value={stats.activeAssignments} color="green" />
            <StatCard icon={<AlertTriangle size={20} />} label="חריגות יעד" value={stats.overdueAssignments} color="red" />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="card p-4 md:col-span-2">
              <h2 className="section-title mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-gold" /> ביקורים שבועיים (8 שבועות אחרונים)
              </h2>
              <VisitsChart data={stats.visitsPerWeek} />
            </div>
            <div className="card p-4 flex flex-col items-center justify-center gap-4">
              <HealthScore score={stats.healthScore} />
              <div className="text-center">
                <p className="text-xs text-dark/40 dark:text-cream/40">
                  {stats.overdueAssignments === 0 ? "כל ההקצאות בזמן" : `${stats.overdueAssignments} הקצאות חריגות`}
                </p>
                <p className="text-xs text-dark/40 dark:text-cream/40 mt-0.5">
                  {stats.totalVisits} ביקורים בסה"כ
                </p>
              </div>
              <Link href="/reports" className="btn-ghost text-xs w-full justify-center">
                לדוחות המלאים
              </Link>
            </div>
          </div>

          <div className="card p-4">
            <h2 className="section-title mb-3 flex items-center gap-2">
              <Activity size={16} className="text-gold" /> פעילות אחרונה
            </h2>
            <div className="space-y-2">
              {stats.recentActivity.map((log) => (
                <div key={log.id} className="flex items-center gap-3 py-1.5 border-b border-line last:border-0">
                  <div className="w-7 h-7 rounded-full bg-gold/15 flex items-center justify-center flex-shrink-0">
                    <span className="text-gold text-xs font-bold">{log.user.fullName.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-dark dark:text-cream truncate">
                      <span className="font-medium">{log.user.fullName}</span>{" "}
                      {ACTION_LABELS[log.action] ?? log.action}
                    </p>
                    <p className="text-xs text-dark/40 dark:text-cream/40">{formatDate(log.createdAt)}</p>
                  </div>
                </div>
              ))}
              {stats.recentActivity.length === 0 && (
                <p className="muted text-center py-4">אין פעילות עדיין</p>
              )}
            </div>
            <Link href="/activity" className="btn-ghost w-full justify-center mt-3 text-xs">לכל הפעילות</Link>
          </div>
        </>
      )}

      {stats.role === "DOMAIN_MANAGER" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={<Building2 size={20} />} label="מתחמים בתחום" value={stats.myComplexes} color="gold" />
            <StatCard icon={<Clock size={20} />} label="הקצאות פעילות" value={stats.myAssignments.length} color="blue" />
            <StatCard icon={<AlertTriangle size={20} />} label="חריגות יעד" value={stats.overdueAssignments} color="red" />
            <StatCard icon={<Bell size={20} />} label="יעד שבועי קרוב" value={stats.urgentAssignments} color="amber" />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="card p-4 md:col-span-2">
              <h2 className="section-title mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-gold" /> ביקורים שבועיים
              </h2>
              <VisitsChart data={stats.visitsPerWeek} />
            </div>
            <div className="card p-4 flex flex-col items-center justify-center gap-4">
              <HealthScore score={stats.healthScore} />
              <p className="text-xs text-dark/40 dark:text-cream/40 text-center">
                {stats.overdueAssignments === 0 ? "כל ההקצאות בזמן ✓" : `${stats.overdueAssignments} חריגות`}
              </p>
            </div>
          </div>

          {stats.needsAttention.length > 0 && (
            <div className="card p-4 border-amber-500/20">
              <h2 className="section-title mb-3 flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertTriangle size={16} /> דורשים תשומת לב
              </h2>
              <div className="space-y-2">
                {stats.needsAttention.map((a: any) => {
                  const days = daysRemaining(a.deadlineAt);
                  return (
                    <Link key={a.id} href={`/complexes/${a.complex.id}`}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 hover:border-amber-500/40 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-dark dark:text-cream">{a.complex.name}</p>
                        <p className="text-xs text-dark/40 dark:text-cream/40">{a.complex.city}</p>
                      </div>
                      <span className={`text-xs font-semibold ${deadlineColor(days)}`}>
                        {days < 0 ? `חרג ב-${Math.abs(days)}י'` : `${days}י'`}
                      </span>
                    </Link>
                  );
                })}
              </div>
              <Link href="/reminders" className="btn-ghost w-full justify-center mt-3 text-xs">לכל התזכורות</Link>
            </div>
          )}

          <div className="card p-4">
            <h2 className="section-title mb-3">הקצאות פעילות — לפי דחיפות</h2>
            {stats.myAssignments.length === 0 ? (
              <p className="muted text-center py-6">אין הקצאות פעילות כרגע</p>
            ) : (
              <div className="space-y-2">
                {stats.myAssignments.map((a: any) => {
                  const days = daysRemaining(a.deadlineAt);
                  return (
                    <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg bg-offwhite dark:bg-dark-soft border border-line">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-dark dark:text-cream truncate">{a.complex.name}</p>
                        <p className="text-xs text-dark/40 dark:text-cream/40">{a.complex.city} · {a.user.fullName}</p>
                      </div>
                      <span className={`text-sm font-semibold tabular-nums ${deadlineColor(days)}`}>
                        {days < 0 ? `חרג ב-${Math.abs(days)}י'` : `${days} ימים`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            <Link href="/complexes" className="btn-ghost w-full justify-center mt-3 text-xs">לכל המתחמים</Link>
          </div>
        </>
      )}

      {stats.role === "AREA_MANAGER" && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={<Building2 size={20} />} label="מתחמים שלי" value={stats.myAssignments.length} color="gold" />
            <StatCard icon={<AlertTriangle size={20} />} label="חריגות יעד" value={stats.myAssignments.filter((a: any) => daysRemaining(a.deadlineAt) < 0).length} color="red" />
          </div>

          <div className="card p-4">
            <h2 className="section-title mb-3">המתחמים שלי</h2>
            {stats.myAssignments.length === 0 ? (
              <div className="text-center py-8">
                <Building2 size={32} className="text-dark/20 dark:text-cream/20 mx-auto mb-2" />
                <p className="muted">אין מתחמים מוקצים כרגע</p>
              </div>
            ) : (
              <div className="space-y-2">
                {stats.myAssignments.map((a: any) => {
                  const days = daysRemaining(a.deadlineAt);
                  const pct = Math.max(0, Math.min(100, ((a.deadlineDays - days) / a.deadlineDays) * 100));
                  return (
                    <Link key={a.id} href={`/complexes/${a.complexId}`}
                      className="block p-3 rounded-lg bg-offwhite dark:bg-dark-soft border border-line hover:border-gold transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-dark dark:text-cream">{a.complex.name}</p>
                        <span className={`text-xs font-semibold tabular-nums ${deadlineColor(days)}`}>
                          {days < 0 ? `חרג ב-${Math.abs(days)}י'` : `${days}י'`}
                        </span>
                      </div>
                      <p className="text-xs text-dark/40 dark:text-cream/40 mb-2">{a.complex.city}</p>
                      <div className="deadline-bar">
                        <div className={`deadline-bar-fill ${days < 0 ? "bg-red-500" : days <= 7 ? "bg-amber-500" : "bg-gold"}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {stats.recentVisits.length > 0 && (
            <div className="card p-4">
              <h2 className="section-title mb-3 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-gold" /> ביקורים אחרונים שלי
              </h2>
              <div className="space-y-2">
                {stats.recentVisits.map((v: any) => (
                  <div key={v.id} className="flex items-center justify-between py-1.5 border-b border-line last:border-0">
                    <p className="text-sm text-dark dark:text-cream">{v.complex.name}</p>
                    <p className="text-xs text-dark/40 dark:text-cream/40">{formatDate(v.visitDate)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: "gold" | "blue" | "green" | "red" | "amber";
}) {
  const colorMap = {
    gold: "bg-gold/10 text-gold",
    blue: "bg-blue-500/10 text-blue-500",
    green: "bg-emerald-500/10 text-emerald-500",
    red: "bg-red-500/10 text-red-500",
    amber: "bg-amber-500/10 text-amber-500",
  };
  return (
    <div className="card p-4">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${colorMap[color]}`}>
        {icon}
      </div>
      <p className="text-2xl font-display font-semibold text-dark dark:text-cream">{value}</p>
      <p className="muted text-xs mt-0.5">{label}</p>
    </div>
  );
}
