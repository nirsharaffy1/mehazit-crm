import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CrmRole } from "@/types";
import { daysRemaining } from "@/lib/utils";
import RemindersClient from "@/components/features/RemindersClient";

export default async function RemindersPage() {
  const session = await auth();
  if (!session?.user || session.user.role === "AREA_MANAGER") redirect("/dashboard");

  const role = session.user.role as CrmRole;
  const domainFilter = role === "DOMAIN_MANAGER" && session.user.domainId
    ? { complex: { domainId: session.user.domainId } }
    : {};

  const assignments = await prisma.crmComplexAssignment.findMany({
    where: { isActive: true, ...domainFilter },
    include: {
      complex: { select: { id: true, name: true, city: true, domain: { select: { id: true, name: true } } } },
      user: { select: { fullName: true, phone: true } },
    },
    orderBy: { deadlineAt: "asc" },
  });

  const rows = assignments.map((a) => ({
    id: a.id,
    complexId: a.complex.id,
    complexName: a.complex.name,
    city: a.complex.city,
    managerName: a.user.fullName,
    phone: a.user.phone,
    deadlineAt: a.deadlineAt.toISOString(),
    days: daysRemaining(a.deadlineAt),
    domainId: a.complex.domain?.id ?? null,
    domainName: a.complex.domain?.name ?? "ללא תחום",
  }));

  const overdue = rows.filter((r) => r.days < 0);
  const urgent = rows.filter((r) => r.days >= 0 && r.days <= 7);
  const upcoming = rows.filter((r) => r.days > 7 && r.days <= 14);

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto w-full">
      <div>
        <h1 className="page-title">תזכורות WhatsApp</h1>
        <p className="text-sm text-dark/50 dark:text-cream/50 mt-1">
          מתחמים שמתקרבים לדד-ליין — שלח תזכורת אישית למנהל האיזור
        </p>
      </div>
      <RemindersClient overdue={overdue} urgent={urgent} upcoming={upcoming} isGeneralAdmin={role === "GENERAL_ADMIN"} />
    </div>
  );
}
