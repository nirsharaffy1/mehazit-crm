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

  const domainNames = ["צפון", "מרכז", "דרום"];
  const domains: DomainGroup[] = domainNames.map((name) => ({
    domainName: name,
    domainManager: active.find((u) => u.role === "DOMAIN_MANAGER" && u.domain?.name === name)
      ? toRow(active.find((u) => u.role === "DOMAIN_MANAGER" && u.domain?.name === name)!)
      : null,
    areaManagers: active
      .filter((u) => u.role === "AREA_MANAGER" && u.domain?.name === name)
      .map(toRow),
  }));

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto w-full">
      <div>
        <h1 className="page-title">קישורי כניסה</h1>
        <p className="text-sm text-dark/50 dark:text-cream/50 mt-1">
          שלחו לכל חבר צוות את הקישור וההודעה האישית שלו
        </p>
      </div>
      <LoginLinksClient admins={admins} domains={domains} inactive={inactive} />
    </div>
  );
}
