import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AddUserModal from "@/components/features/AddUserModal";
import UsersTableClient from "@/components/features/UsersTableClient";

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

  const [users, weekVisits, domains] = await Promise.all([
    prisma.crmUser.findMany({
      include: { domain: true },
      orderBy: [{ role: "asc" }, { fullName: "asc" }],
    }),
    prisma.crmVisit.groupBy({
      by: ["userId"],
      where: { visitDate: { gte: start, lt: end } },
      _count: { id: true },
    }),
    prisma.crmDomain.findMany({ orderBy: { name: "asc" } }),
  ]);

  const visitsByUser = Object.fromEntries(weekVisits.map((v) => [v.userId, v._count.id]));

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <h1 className="page-title">ניהול משתמשים</h1>
        <AddUserModal />
      </div>

      <UsersTableClient
        initialUsers={users.map(u => ({
          ...u,
          lastLoginAt: u.lastLoginAt ?? null,
        }))}
        domains={domains}
        visitsByUser={visitsByUser}
      />
    </div>
  );
}
