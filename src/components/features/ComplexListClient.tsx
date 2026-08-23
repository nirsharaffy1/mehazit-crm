"use client";
import { useState } from "react";
import Link from "next/link";
import { Building2, MapPin, Clock, LayoutGrid, List, Trash2, X } from "lucide-react";
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
  isAdmin?: boolean;
}

function DeleteButton({ id, name, onDeleted }: { id: string; name: string; onDeleted: () => void }) {
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    try {
      const res = await fetch(`/api/complexes/${id}`, { method: "DELETE" });
      if (res.ok) onDeleted();
    } finally {
      setLoading(false);
      setConfirm(false);
    }
  }

  if (confirm) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => setConfirm(false)}>
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative w-full max-w-sm card p-6" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-dark dark:text-cream">מחיקת מתחם</h2>
            <button onClick={() => setConfirm(false)} className="text-dark/30 dark:text-cream/30 hover:text-dark dark:hover:text-cream">
              <X size={18} />
            </button>
          </div>
          <p className="text-sm text-dark/70 dark:text-cream/70 mb-5">
            האם למחוק את המתחם <strong className="text-dark dark:text-cream">"{name}"</strong>?<br />
            <span className="text-xs text-dark/40 dark:text-cream/40">הפעולה תסיר את המתחם מהרשימה.</span>
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-60"
            >
              {loading ? "מוחק..." : "כן, מחק"}
            </button>
            <button onClick={() => setConfirm(false)} className="flex-1 btn-ghost">ביטול</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirm(true); }}
      className="text-dark/20 dark:text-cream/20 hover:text-red-500 transition-colors flex-shrink-0"
      title="מחיקת מתחם"
    >
      <Trash2 size={15} />
    </button>
  );
}

export default function ComplexListClient({ complexes, assignments, isAreaManager, isAdmin }: Props) {
  const [view, setView] = useState<"cards" | "table">("cards");
  const [items, setItems] = useState(complexes ?? []);

  function removeItem(id: string) {
    setItems(prev => prev.filter(c => c.id !== id));
  }

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

      {items.length === 0 ? (
        <div className="card p-12 text-center">
          <Building2 size={40} className="text-dark/20 dark:text-cream/20 mx-auto mb-3" />
          <p className="text-dark/50 dark:text-cream/50">אין מתחמים</p>
        </div>
      ) : view === "cards" ? (
        <div className="grid gap-3">
          {items.map((c) => {
            const activeAssignment = c.assignments?.[0];
            return (
              <div key={c.id} className="card p-4 hover:border-gold transition-all">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/complexes/${c.id}`} className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-sm font-semibold text-dark dark:text-cream truncate hover:text-gold transition-colors">{c.name}</h2>
                      {c.domain && <span className="badge badge-gray text-xs">{c.domain.name}</span>}
                    </div>
                    <p className="flex items-center gap-1 text-xs text-dark/50 dark:text-cream/50">
                      <MapPin size={11} /> {c.address}, {c.city}
                    </p>
                    {c.assignments.length > 0 && (
                      <p className="text-xs text-dark/40 dark:text-cream/40 mt-1">
                        מוקצה ל: {c.assignments.map((a) => a.user.fullName).join(", ")}
                      </p>
                    )}
                  </Link>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <p className="text-xs text-dark/40 dark:text-cream/40">{c._count?.visits ?? 0} ביקורים</p>
                    {c.assignments.length === 0 && <span className="badge badge-gray">לא מוקצה</span>}
                    {isAdmin && <DeleteButton id={c.id} name={c.name} onDeleted={() => removeItem(c.id)} />}
                  </div>
                </div>
              </div>
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
                  {isAdmin && <th className="px-4 py-2.5 w-8"></th>}
                </tr>
              </thead>
              <tbody>
                {items.map((c) => {
                  const mgr = c.assignments?.length ? c.assignments.map((a) => a.user.fullName).join(", ") : "—";
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
                      {isAdmin && (
                        <td className="px-4 py-2.5">
                          <DeleteButton id={c.id} name={c.name} onDeleted={() => removeItem(c.id)} />
                        </td>
                      )}
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
