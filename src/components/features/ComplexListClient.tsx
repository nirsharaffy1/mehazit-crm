"use client";
import { useState } from "react";
import Link from "next/link";
import { Building2, MapPin, Clock, LayoutGrid, List } from "lucide-react";
import { daysRemaining, deadlineColor, formatDate } from "@/lib/utils";

export interface ComplexItem {
  id: string;
  name: string;
  city: string;
  address: string;
  domain: { name: string } | null;
  assignments: Array<{ user: { fullName: string } }>;
  _count: { visits: number };
}

export interface AssignmentItem {
  id: string;
  complexId: string;
  deadlineAt: string;
  deadlineDays: number;
  complex: { id: string; name: string; city: string; domain: { name: string } | null };
}

interface Props {
  complexes?: ComplexItem[];
  assignments?: AssignmentItem[];
  isAreaManager: boolean;
}

export default function ComplexListClient({ complexes, assignments, isAreaManager }: Props) {
  const [view, setView] = useState<"cards" | "table">("cards");

  if (isAreaManager && assignments) {
    return (
      <div className="grid gap-3">
        {assignments.map((a) => {
          const days = daysRemaining(new Date(a.deadlineAt));
          const pct = Math.max(0, Math.min(100, ((a.deadlineDays - days) / a.deadlineDays) * 100));
          return (
            <Link key={a.id} href={`/complexes/${a.complexId}`} className="card p-4 hover:border-gold transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-sm font-semibold text-dark dark:text-cream truncate">{a.complex.name}</h2>
                    {days < 0 && <span className="badge badge-red text-xs">חריגה</span>}
                    {days >= 0 && days <= 7 && <span className="badge badge-gold text-xs">דחוף</span>}
                  </div>
                  <p className="flex items-center gap-1 text-xs text-dark/50 dark:text-cream/50">
                    <MapPin size={11} /> {a.complex.city}
                    {a.complex.domain && <> · {a.complex.domain.name}</>}
                  </p>
                </div>
                <div className="text-left flex-shrink-0">
                  <p className={`text-sm font-bold tabular-nums ${deadlineColor(days)}`}>
                    {days < 0 ? `חרג ב-${Math.abs(days)}י'` : `${days} ימים`}
                  </p>
                  <p className="text-xs text-dark/40 dark:text-cream/40 mt-0.5 flex items-center gap-1">
                    <Clock size={10} /> {formatDate(new Date(a.deadlineAt))}
                  </p>
                </div>
              </div>
              <div className="mt-3 deadline-bar">
                <div
                  className={`deadline-bar-fill ${days < 0 ? "bg-red-500" : days <= 7 ? "bg-amber-500" : "bg-gold"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </Link>
          );
        })}
      </div>
    );
  }

  const items = complexes ?? [];

  return (
    <div>
      <div className="flex justify-end mb-3">
        <div className="inline-flex rounded-lg border border-line overflow-hidden">
          <button
            onClick={() => setView("cards")}
            className={`px-3 py-1.5 text-xs flex items-center gap-1.5 transition-colors ${view === "cards" ? "bg-gold/15 text-gold" : "text-dark/50 dark:text-cream/50 hover:bg-offwhite dark:hover:bg-dark-soft"}`}
          >
            <LayoutGrid size={13} /> כרטיסים
          </button>
          <button
            onClick={() => setView("table")}
            className={`px-3 py-1.5 text-xs flex items-center gap-1.5 transition-colors border-r border-line ${view === "table" ? "bg-gold/15 text-gold" : "text-dark/50 dark:text-cream/50 hover:bg-offwhite dark:hover:bg-dark-soft"}`}
          >
            <List size={13} /> טבלה
          </button>
        </div>
      </div>

      {view === "cards" ? (
        <div className="grid gap-3">
          {items.map((c) => {
            const activeAssignment = c.assignments?.[0];
            return (
              <Link key={c.id} href={`/complexes/${c.id}`} className="card p-4 hover:border-gold transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-sm font-semibold text-dark dark:text-cream truncate">{c.name}</h2>
                      {c.domain && <span className="badge badge-gray text-xs">{c.domain.name}</span>}
                    </div>
                    <p className="flex items-center gap-1 text-xs text-dark/50 dark:text-cream/50">
                      <MapPin size={11} /> {c.address}, {c.city}
                    </p>
                    {activeAssignment && (
                      <p className="text-xs text-dark/40 dark:text-cream/40 mt-1">מוקצה ל: {activeAssignment.user.fullName}</p>
                    )}
                  </div>
                  <div className="text-left flex-shrink-0 text-xs text-dark/40 dark:text-cream/40">
                    <p>{c._count?.visits ?? 0} ביקורים</p>
                    {!activeAssignment && <span className="badge badge-gray mt-1">לא מוקצה</span>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-offwhite dark:bg-dark-soft">
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-dark/50 dark:text-cream/50">מתחם</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-dark/50 dark:text-cream/50">עיר</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-dark/50 dark:text-cream/50">תחום</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-dark/50 dark:text-cream/50">מנהל איזור</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-dark/50 dark:text-cream/50">ביקורים</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => {
                  const mgr = c.assignments?.[0]?.user?.fullName ?? "—";
                  return (
                    <tr key={c.id} className="border-b border-line last:border-0 hover:bg-gold/5 transition-colors">
                      <td className="px-4 py-2.5">
                        <Link href={`/complexes/${c.id}`} className="font-medium text-dark dark:text-cream hover:text-gold transition-colors">
                          {c.name}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-dark/60 dark:text-cream/60">{c.city}</td>
                      <td className="px-4 py-2.5 text-dark/60 dark:text-cream/60">{c.domain?.name ?? "—"}</td>
                      <td className="px-4 py-2.5 text-dark/60 dark:text-cream/60">{mgr}</td>
                      <td className="px-4 py-2.5 text-dark/60 dark:text-cream/60">{c._count?.visits ?? 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
