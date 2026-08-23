import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import LoginLinksClient from "@/components/features/LoginLinksClient";
import type { DomainGroup, UserRow } from "@/types/login-links";

export default async function LoginLinksPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "GENERAL_ADMIN") redirect("/dashboard");

  const users = await prisma.crmUser.findMany({
    include: { domain: true },
    orderBy: { fullName: "asc" },
  });

  const toRow = (u: typeof users[number]): UserRow => ({
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    phone: u.phone,
    isActive: u.isActive,
    role: u.role,
    domainName: u.domain?.name ?? null,
  });

  const active = users.filter((u) => u.isActive);
  const inactive = users.filter((u) => !u.isActive).map(toRow);

  const admins = active.filter((u) => u.role === "GENERAL_ADMIN").map(toRow);

  const dbDomains = await prisma.crmDomain.findMany({ orderBy: { name: "asc" } });
  const domainNameSet = new Set(dbDomains.map((d) => d.name));
  const domains: DomainGroup[] = dbDomains.map((dom) => ({
    domainName: dom.name,
    domainManager: (() => {
      const mgr = active.find((u) => u.role === "DOMAIN_MANAGER" && u.domain?.name === dom.name);
      return mgr ? toRow(mgr) : null;
    })(),
    areaManagers: active
      .filter((u) => u.role === "AREA_MANAGER" && u.domain?.name === dom.name)
      .map(toRow),
  }));

  // Users who are active, not admin, and don't belong to any known domain
  const unassigned = active
    .filter((u) => u.role !== "GENERAL_ADMIN" && (!u.domain || !domainNameSet.has(u.domain.name)))
    .map(toRow);

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto w-full">
      <div>
        <h1 className="page-title">קישורי כניסה</h1>
        <p className="text-sm text-dark/50 dark:text-cream/50 mt-1">
          שלחו לכל חבר צוות את הקישור וההודעה האישית שלו
        </p>
      </div>
      <LoginLinksClient admins={admins} domains={domains} inactive={inactive} unassigned={unassigned} />
    </div>
  );
}
