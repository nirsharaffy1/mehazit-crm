import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { CrmRole, ENGAGEMENT_LABELS, ENGAGEMENT_COLORS } from "@/types";
import { formatDate, daysRemaining, deadlineColor, buildWhatsappUrl, reminderWhatsappMessage } from "@/lib/utils";
import Link from "next/link";
import {
  ArrowRight, MapPin, Calendar, MessageCircle,
  CheckCircle, AlertTriangle, Clock, FileText, UserCheck, Layers
} from "lucide-react";
import AssignModal from "@/components/features/AssignModal";
import EditDeadlineButton from "@/components/features/EditDeadlineButton";
import AddVisitModal from "@/components/features/AddVisitModal";
import PhaseTimeline from "@/components/features/PhaseTimeline";
import AssemblyDetails from "@/components/features/AssemblyDetails";
import ComplexNotes from "@/components/features/ComplexNotes";
import ResidentContacts from "@/components/features/ResidentContacts";
import PrintButton from "@/components/features/PrintButton";

async function getComplex(id: string, role: CrmRole, userId: string) {
  const complex = await prisma.crmComplex.findUnique({
    where: { id },
    include: {
      domain: true,
      assignments: {
        where: { isActive: true },
        include: { user: { select: { id: true, fullName: true, phone: true } } },
        orderBy: { assignedAt: "desc" },
      },
      visits: {
        include: { user: { select: { fullName: true } } },
        orderBy: { visitDate: "desc" },
      },
      notes: {
        include: { user: { select: { fullName: true } } },
        orderBy: { createdAt: "desc" },
      },
      residents: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!complex) return null;

  if (role === "AREA_MANAGER") {
    const isAssigned = complex.assignments.some((a) => a.userId === userId);
    if (!isAssigned) return null;
  }

  return complex;
}

export default async function ComplexDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as CrmRole;
  const { id } = await params;
  const complex = await getComplex(id, role, session.user.id);
  if (!complex) notFound();

  const activeAssignments = complex.assignments;
  const activeAssignment = activeAssignments[0];
  const days = activeAssignment ? daysRemaining(activeAssignment.deadlineAt) : null;
  const activeManagerIds = activeAssignments.map((a) => a.user.id);

  const canAssign = role === "GENERAL_ADMIN" || role === "DOMAIN_MANAGER";
  const canAddVisit = role === "AREA_MANAGER" || !!activeAssignment;

  const lastVisit = complex.visits[0];
  const lastVisitForModal = lastVisit ? {
    engagement: lastVisit.engagement as any,
    residentsMetCount: lastVisit.residentsMetCount,
    newSignatures: lastVisit.newSignatures,
    hasAmidorAmigur: lastVisit.hasAmidorAmigur,
    notes: lastVisit.notes,
  } : undefined;

  const serializedNotes = complex.notes.map((n) => ({
    id: n.id,
    content: n.content,
    createdAt: n.createdAt.toISOString(),
    user: { fullName: n.user.fullName },
  }));

  const serializedResidents = complex.residents.map((r) => ({
    id: r.id,
    fullName: r.fullName,
    phone: r.phone,
    apartment: r.apartment,
    building: r.building,
    signedPoA: r.signedPoA,
    notes: r.notes,
  }));

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto w-full">
      {/* Back + print */}
      <div className="flex items-center justify-between">
        <Link href="/complexes" className="inline-flex items-center gap-1.5 text-sm text-dark/50 dark:text-cream/50 hover:text-gold transition-colors">
          <ArrowRight size={14} /> חזרה למתחמים
        </Link>
        <PrintButton />
      </div>

      {/* Header */}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="page-title">{complex.name}</h1>
              {complex.domain && <span className="badge badge-gray">{complex.domain.name}</span>}
            </div>
            <p className="flex items-center gap-1.5 text-sm text-dark/50 dark:text-cream/50">
              <MapPin size={14} /> {complex.address}, {complex.city}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {canAssign && (
              <AssignModal complexId={complex.id} complexName={complex.name} activeManagerIds={activeManagerIds} />
            )}
            {role === "GENERAL_ADMIN" && (
              <Link href={`/complexes/${complex.id}/edit`} className="btn-ghost text-sm">
                עריכה
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-line">
          {complex.unitCount && <DetailItem label="יחידות דיור" value={String(complex.unitCount)} />}
          {complex.buildingCount && <DetailItem label="בניינים" value={String(complex.buildingCount)} />}
          {complex.gush && <DetailItem label="גוש" value={complex.gush} />}
          {complex.helka && <DetailItem label="חלקה" value={complex.helka} />}
          {complex.developerName && <DetailItem label="יזם" value={complex.developerName} />}
          <DetailItem label="ביקורים" value={String(complex.visits.length)} />
          {complex.residents.length > 0 && (
            <DetailItem label="חתימות יפ״כ" value={`${complex.residents.filter((r) => r.signedPoA).length} / ${complex.residents.length}`} />
          )}
        </div>

        {complex.description && (
          <p className="mt-3 text-sm text-dark/60 dark:text-cream/60 pt-3 border-t border-line">
            {complex.description}
          </p>
        )}
      </div>

      {/* Phase */}
      <div className="card p-4">
        <h2 className="section-title mb-4 flex items-center gap-2">
          <Layers size={16} className="text-gold" /> שלב הפרויקט
        </h2>
        <PhaseTimeline complexId={complex.id} initialPhase={complex.phase} canEdit={canAssign} />
        {complex.phase === "SURVEY" && (
          <div className="mt-4 pt-4 border-t border-line">
            <p className="text-xs font-semibold text-dark/50 dark:text-cream/50 mb-1 flex items-center gap-1.5">
              <Calendar size={13} className="text-gold" /> פרטי כנס דיירים
            </p>
            <AssemblyDetails
              complexId={complex.id}
              initialDate={complex.assemblyDate?.toISOString() ?? null}
              initialTime={complex.assemblyTime ?? null}
              initialLocation={complex.assemblyLocation ?? null}
              canEdit={canAssign}
            />
          </div>
        )}
      </div>

      {/* Assignment */}
      {activeAssignments.length > 0 && days !== null ? (
        <div className="card p-4">
          <h2 className="section-title mb-3 flex items-center gap-2">
            <Clock size={16} className="text-gold" /> הקצאות פעילות ({activeAssignments.length})
          </h2>

          {/* Shared deadline bar (all assignments share the same deadlineAt) */}
          <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
            <div>
              <p className="text-xs text-dark/40 dark:text-cream/40">
                הוקצה: {formatDate(activeAssignment.assignedAt)} · יעד: {formatDate(activeAssignment.deadlineAt)}
              </p>
              {activeAssignment.note && (
                <p className="text-xs text-dark/50 dark:text-cream/50 mt-1 italic">{activeAssignment.note}</p>
              )}
            </div>
            <div className="text-left flex items-center gap-3">
              <div>
                <p className={`text-xl font-bold tabular-nums ${deadlineColor(days)}`}>
                  {days < 0 ? `חרג ב-${Math.abs(days)}` : days} ימים
                </p>
                {days < 0 && <span className="badge badge-red text-xs">חריגה</span>}
                {days >= 0 && days <= 7 && <span className="badge badge-gold text-xs">שבוע אחרון</span>}
              </div>
              {canAssign && (
                <EditDeadlineButton
                  assignmentId={activeAssignment.id}
                  currentDays={activeAssignment.deadlineDays}
                />
              )}
            </div>
          </div>
          <div className="deadline-bar mb-4">
            <div
              className={`deadline-bar-fill ${days < 0 ? "bg-red-500" : days <= 7 ? "bg-amber-500" : "bg-gold"}`}
              style={{ width: `${Math.max(0, Math.min(100, ((activeAssignment.deadlineDays - days) / activeAssignment.deadlineDays) * 100))}%` }}
            />
          </div>

          {/* List of assignees */}
          <div className="space-y-2">
            {activeAssignments.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-offwhite dark:bg-dark-soft">
                <p className="text-sm font-medium text-dark dark:text-cream">{a.user.fullName}</p>
                {a.user.phone && days <= 7 && (
                  <a
                    href={buildWhatsappUrl(
                      a.user.phone,
                      reminderWhatsappMessage(a.user.fullName, complex.name, complex.city, Math.max(0, days))
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary text-xs flex items-center gap-1"
                  >
                    <MessageCircle size={13} /> תזכורת
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : canAssign && (
        <div className="card p-4 border-dashed text-center">
          <p className="muted mb-2">מתחם זה אינו מוקצה</p>
          <AssignModal complexId={complex.id} complexName={complex.name} activeManagerIds={[]} />
        </div>
      )}

      {/* Resident Contacts */}
      <ResidentContacts complexId={complex.id} initialResidents={serializedResidents} canEdit={canAssign} />

      {/* Visits */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title flex items-center gap-2">
            <FileText size={16} className="text-gold" /> היסטוריית ביקורים ({complex.visits.length})
          </h2>
          {(role === "AREA_MANAGER" || canAssign) && (
            <AddVisitModal complexId={complex.id} lastVisit={lastVisitForModal} />
          )}
        </div>

        {complex.visits.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle size={32} className="text-dark/20 dark:text-cream/20 mx-auto mb-2" />
            <p className="muted">אין ביקורים רשומים עדיין</p>
          </div>
        ) : (
          <div className="space-y-3">
            {complex.visits.map((v) => (
              <div key={v.id} className="p-3 rounded-lg bg-offwhite dark:bg-dark-soft border border-line">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-dark dark:text-cream">{formatDate(v.visitDate)}</span>
                    <span className={`badge text-xs ${ENGAGEMENT_COLORS[v.engagement]}`}>{ENGAGEMENT_LABELS[v.engagement]}</span>
                  </div>
                  <span className="text-xs text-dark/40 dark:text-cream/40">{v.user.fullName}</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                  {v.residentsMetCount != null && (
                    <VisitDetail icon={<UserCheck size={12} />} label="נפגשו" value={`${v.residentsMetCount} דיירים`} />
                  )}
                  {v.newSignatures > 0 && (
                    <VisitDetail icon={<CheckCircle size={12} />} label="חתימות חדשות" value={String(v.newSignatures)} />
                  )}
                  {v.hasAmidorAmigur && (
                    <VisitDetail icon={<AlertTriangle size={12} />} label="עמידר/עמיגור" value="יש" alert />
                  )}
                  {v.nextVisitDate && (
                    <VisitDetail icon={<Calendar size={12} />} label="ביקור הבא" value={formatDate(v.nextVisitDate)} />
                  )}
                </div>

                {v.notes && (
                  <p className="text-xs text-dark/60 dark:text-cream/60 border-t border-line pt-2 mt-2">{v.notes}</p>
                )}
                {v.fileUrls.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {v.fileUrls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-gold hover:underline">
                        {i === 0 ? "📷 תמונה" : `קובץ ${i + 1}`}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      <ComplexNotes complexId={complex.id} initialNotes={serializedNotes} />
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-dark/40 dark:text-cream/40">{label}</p>
      <p className="text-sm font-medium text-dark dark:text-cream mt-0.5">{value}</p>
    </div>
  );
}

function VisitDetail({ icon, label, value, alert }: {
  icon: React.ReactNode; label: string; value: string; alert?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={alert ? "text-amber-500" : "text-dark/40 dark:text-cream/40"}>{icon}</span>
      <span className="text-xs text-dark/50 dark:text-cream/50">{label}:</span>
      <span className={`text-xs font-medium ${alert ? "text-amber-600" : "text-dark dark:text-cream"}`}>{value}</span>
    </div>
  );
}
