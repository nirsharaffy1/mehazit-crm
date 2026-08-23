import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import { ENGAGEMENT_LABELS, PHASE_LABELS, CrmRole } from "@/types";
import { formatDate, daysRemaining } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role === "AREA_MANAGER")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
        include: { user: { select: { fullName: true, phone: true } } },
        take: 1,
        orderBy: { assignedAt: "desc" },
      },
      visits: { orderBy: { visitDate: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Sheet 1 — Complexes summary
  const complexRows = complexes.map(c => {
    const assignment = c.assignments[0];
    const lastVisit = c.visits[0];
    const days = assignment ? daysRemaining(assignment.deadlineAt) : null;
    return {
      "שם מתחם": c.name,
      "כתובת": c.address,
      "עיר": c.city,
      "תחום": c.domain?.name ?? "",
      "שלב פרויקט": PHASE_LABELS[c.phase],
      "גוש": c.gush ?? "",
      "חלקה": c.helka ?? "",
      "יחידות": c.unitCount ?? "",
      "בניינים": c.buildingCount ?? "",
      "יזם": c.developerName ?? "",
      "מנהל איזור": assignment?.user.fullName ?? "",
      "טלפון מנהל": assignment?.user.phone ?? "",
      "יעד (ימים)": assignment?.deadlineDays ?? "",
      "תאריך יעד": assignment ? formatDate(assignment.deadlineAt) : "",
      "ימים שנותרו": days !== null ? days : "",
      "סטטוס יעד": days === null ? "לא מוקצה" : days < 0 ? "חריגה" : days <= 7 ? "דחוף" : "בסדר",
      "מספר ביקורים": c.visits.length,
      "ביקור אחרון": lastVisit ? formatDate(lastVisit.visitDate) : "",
      "היענות אחרונה": lastVisit ? ENGAGEMENT_LABELS[lastVisit.engagement] : "",
      "חתימות יפ\"כ סה\"כ": c.visits.reduce((s, v) => s + v.newSignatures, 0),
      "עמידר/עמיגור": c.visits.some(v => v.hasAmidorAmigur) ? "כן" : "לא",
    };
  });

  // Sheet 2 — Visits log
  const allVisits = complexes.flatMap(c =>
    c.visits.map(v => ({
      "מתחם": c.name,
      "עיר": c.city,
      "תחום": c.domain?.name ?? "",
      "תאריך ביקור": formatDate(v.visitDate),
      "רמת היענות": ENGAGEMENT_LABELS[v.engagement],
      "נפגשו": v.residentsMetCount ?? "",
      "חתימות חדשות": v.newSignatures,
      "עמידר/עמיגור": v.hasAmidorAmigur ? "כן" : "לא",
      "הערות": v.notes ?? "",
    }))
  );

  const wb = XLSX.utils.book_new();
  const wsComplexes = XLSX.utils.json_to_sheet(complexRows);
  const wsVisits = XLSX.utils.json_to_sheet(allVisits);
  XLSX.utils.book_append_sheet(wb, wsComplexes, "מתחמים");
  XLSX.utils.book_append_sheet(wb, wsVisits, "ביקורים");

  // Auto-fit column widths for complexes sheet
  const colWidths = complexRows.length > 0
    ? Object.keys(complexRows[0]).map(k => ({ wch: Math.max(k.length, 12) }))
    : [];
  wsComplexes["!cols"] = colWidths;

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const dateStr = new Date().toISOString().split("T")[0];

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="mehazit-report-${dateStr}.xlsx"`,
    },
  });
}
