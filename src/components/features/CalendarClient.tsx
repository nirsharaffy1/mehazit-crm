"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface VisitEvent {
  id: string;
  visitDate: string;
  nextVisitDate: string | null;
  complexId: string;
  complexName: string;
  city: string;
  managerName: string;
  engagement: string;
}

const HEBREW_MONTHS = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
];
const DAYS_HE = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"];

const ENGAGEMENT_DOT: Record<string, string> = {
  HIGH: "bg-emerald-500",
  MEDIUM: "bg-amber-400",
  LOW: "bg-red-400",
  NO_CONTACT: "bg-dark/20 dark:bg-cream/20",
};

interface Props {
  visits: VisitEvent[];
  year: number;
  month: number;
}

export default function CalendarClient({ visits, year, month }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const router = useRouter();

  function navigate(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    router.push(`/calendar?year=${y}&month=${m}`);
  }

  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const visitsByDay = new Map<number, VisitEvent[]>();
  const nextByDay = new Map<number, VisitEvent[]>();

  visits.forEach((v) => {
    const vDate = new Date(v.visitDate);
    if (vDate.getFullYear() === year && vDate.getMonth() + 1 === month) {
      const d = vDate.getDate();
      visitsByDay.set(d, [...(visitsByDay.get(d) ?? []), v]);
    }
    if (v.nextVisitDate) {
      const nDate = new Date(v.nextVisitDate);
      if (nDate.getFullYear() === year && nDate.getMonth() + 1 === month) {
        const d = nDate.getDate();
        nextByDay.set(d, [...(nextByDay.get(d) ?? []), v]);
      }
    }
  });

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
  const todayDate = today.getDate();

  const selectedVisits = selected !== null ? (visitsByDay.get(selected) ?? []) : [];
  const selectedNext = selected !== null ? (nextByDay.get(selected) ?? []) : [];

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2"><ChevronRight size={16} /></button>
        <h2 className="text-base font-semibold text-dark dark:text-cream">
          {HEBREW_MONTHS[month - 1]} {year}
        </h2>
        <button onClick={() => navigate(1)} className="btn-ghost p-2"><ChevronLeft size={16} /></button>
      </div>

      {/* Grid */}
      <div className="card p-3 overflow-hidden">
        <div className="grid grid-cols-7 mb-2">
          {DAYS_HE.map((d) => (
            <div key={d} className="text-center text-xs text-dark/40 dark:text-cream/40 py-1 font-medium">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={i} />;
            const hasVisit = visitsByDay.has(day);
            const hasNext = nextByDay.has(day);
            const isToday = isCurrentMonth && day === todayDate;
            const isSelected = selected === day;

            return (
              <button
                key={day}
                onClick={() => setSelected(isSelected ? null : day)}
                className={cn(
                  "relative aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all",
                  isToday ? "ring-2 ring-gold font-bold" : "",
                  isSelected ? "bg-gold/20 border border-gold" : "hover:bg-offwhite dark:hover:bg-dark-soft",
                  (hasVisit || hasNext) ? "text-dark dark:text-cream" : "text-dark/40 dark:text-cream/40"
                )}
              >
                <span className="text-xs leading-tight">{day}</span>
                {(hasVisit || hasNext) && (
                  <div className="flex gap-0.5 mt-0.5">
                    {hasVisit && <span className="w-1.5 h-1.5 rounded-full bg-gold" />}
                    {hasNext && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-dark/50 dark:text-cream/50">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gold" /> ביקור שנרשם</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-400" /> ביקור מתוכנן</span>
      </div>

      {/* Selected day detail */}
      {selected && (selectedVisits.length > 0 || selectedNext.length > 0) && (
        <div className="card p-4 space-y-3">
          <h3 className="section-title">{selected} {HEBREW_MONTHS[month - 1]} {year}</h3>
          {selectedVisits.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-dark/40 dark:text-cream/40 uppercase tracking-wider mb-1.5">ביקורים שנרשמו</p>
              {selectedVisits.map((v) => (
                <Link key={v.id} href={`/complexes/${v.complexId}`}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gold/5 transition-colors">
                  <span className={cn("w-2 h-2 rounded-full flex-shrink-0", ENGAGEMENT_DOT[v.engagement])} />
                  <span className="text-sm font-medium text-dark dark:text-cream">{v.complexName}</span>
                  <span className="text-xs text-dark/40 dark:text-cream/40">{v.city} · {v.managerName}</span>
                </Link>
              ))}
            </div>
          )}
          {selectedNext.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1.5">ביקורים מתוכננים</p>
              {selectedNext.map((v) => (
                <Link key={`next-${v.id}`} href={`/complexes/${v.complexId}`}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-blue-500/5 transition-colors">
                  <span className="w-2 h-2 rounded-full flex-shrink-0 bg-blue-400" />
                  <span className="text-sm font-medium text-dark dark:text-cream">{v.complexName}</span>
                  <span className="text-xs text-dark/40 dark:text-cream/40">{v.city} · {v.managerName}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {selected && selectedVisits.length === 0 && selectedNext.length === 0 && (
        <div className="card p-4 text-center">
          <p className="muted">אין ביקורים ב-{selected} {HEBREW_MONTHS[month - 1]}</p>
        </div>
      )}
    </div>
  );
}
