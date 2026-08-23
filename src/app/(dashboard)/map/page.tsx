import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CrmRole } from "@/types";
import { daysRemaining } from "@/lib/utils";
import MapWrapper from "@/components/features/MapWrapper";

export default async function MapPage() {
  const session = await auth();
  if (!session?.user || session.user.role === "AREA_MANAGER") redirect("/dashboard");

  const role = session.user.role as CrmRole;
  const domainFilter = role === "DOMAIN_MANAGER" && session.user.domainId
    ? { domainId: session.user.domainId }
    : {};

  const complexes = await prisma.crmComplex.findMany({
    where: { isActive: true, ...domainFilter },
    include: {
      domain: true,
      assignments: {
        where: { isActive: true },
        include: { user: { select: { fullName: true } } },
        take: 1,
        orderBy: { assignedAt: "desc" },
      },
    },
  });

  const markers = complexes.map((c) => {
    const assignment = c.assignments[0];
    const days = assignment ? daysRemaining(assignment.deadlineAt) : null;
    return {
      id: c.id,
      name: c.name,
      address: c.address,
      city: c.city,
      domain: c.domain?.name ?? null,
      lat: c.lat,
      lng: c.lng,
      managerName: assignment?.user.fullName ?? null,
      days,
    };
  });

  const withCoords = markers.filter((m) => m.lat && m.lng);
  const withoutCoords = markers.filter((m) => !m.lat || !m.lng);

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-6xl mx-auto w-full">
      <div>
        <h1 className="page-title">מפה</h1>
        <p className="text-sm text-dark/50 dark:text-cream/50 mt-1">
          {withCoords.length} מתחמים עם קואורדינטות · {withoutCoords.length} ללא מיקום
        </p>
      </div>
      <MapWrapper markers={markers} />
      {withoutCoords.length > 0 && (
        <div className="card p-4">
          <p className="text-xs font-semibold text-dark/40 dark:text-cream/40 uppercase tracking-wider mb-2">
            מתחמים ללא מיקום ({withoutCoords.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {withoutCoords.map((m) => (
              <a key={m.id} href={`/complexes/${m.id}/edit`}
                className="text-xs badge badge-gray hover:bg-gold/20 hover:text-gold transition-colors">
                {m.name}
              </a>
            ))}
          </div>
          <p className="text-xs text-dark/30 dark:text-cream/30 mt-2">
            הוסף קואורדינטות בעריכת המתחם כדי שיופיע במפה
          </p>
        </div>
      )}
    </div>
  );
}
