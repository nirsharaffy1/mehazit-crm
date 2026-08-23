"use client";
import { useState, useEffect } from "react";
import { X, Loader2, MessageCircle, Check } from "lucide-react";
import { buildWhatsappUrl, assignmentWhatsappMessage } from "@/lib/utils";

interface AreaManager { id: string; fullName: string; phone: string | null; role: string; }

export default function AssignModal({
  complexId,
  complexName,
  activeManagerIds = [],
}: {
  complexId: string;
  complexName: string;
  activeManagerIds?: string[];
}) {
  const [open, setOpen] = useState(false);
  const [managers, setManagers] = useState<AreaManager[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(activeManagerIds));
  const [days, setDays] = useState(30);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [assigned, setAssigned] = useState<{ managers: AreaManager[]; city: string } | null>(null);

  useEffect(() => {
    if (open) {
      setSelectedIds(new Set(activeManagerIds));
      fetch("/api/users?roles=AREA_MANAGER,DOMAIN_MANAGER")
        .then((r) => r.json())
        .then((d) => setManagers(d.users ?? []));
    }
  }, [open]);

  function toggleManager(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedIds.size === 0) return;
    setLoading(true);
    const res = await fetch(`/api/assignments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ complexId, userIds: Array.from(selectedIds), deadlineDays: days, note }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      const selected = managers.filter((m) => selectedIds.has(m.id));
      setAssigned({ managers: selected, city: data.city ?? "" });
    }
  }

  function handleClose() {
    setOpen(false);
    setAssigned(null);
    setNote("");
    setDays(30);
    if (assigned) window.location.reload();
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary text-sm">
        הקצה למנהל איזור
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-md p-5 relative max-h-[90vh] overflow-y-auto">
            <button onClick={handleClose} className="absolute top-4 left-4 text-dark/40 dark:text-cream/40 hover:text-dark dark:hover:text-cream">
              <X size={18} />
            </button>

            <h2 className="section-title mb-4">{assigned ? "הוקצה בהצלחה!" : `הקצאת מתחם: ${complexName}`}</h2>

            {assigned ? (
              <div className="space-y-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 text-center">
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                    {complexName} הוקצה ל-{assigned.managers.map((m) => m.fullName).join(", ")} לטיפול תוך {days} ימים
                  </p>
                </div>
                <div className="space-y-2">
                  {assigned.managers.filter((m) => m.phone).map((m) => (
                    <a
                      key={m.id}
                      href={buildWhatsappUrl(
                        m.phone!,
                        assignmentWhatsappMessage(m.fullName, complexName, assigned.city, days, "מנהל התחום")
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary w-full justify-center flex items-center gap-2"
                    >
                      <MessageCircle size={16} /> וואטסאפ ל-{m.fullName}
                    </a>
                  ))}
                </div>
                <button onClick={handleClose} className="btn-ghost w-full justify-center">סגור</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label mb-2 block">מנהלי איזור {selectedIds.size > 0 && <span className="text-gold">({selectedIds.size} נבחרו)</span>}</label>
                  {managers.length === 0 ? (
                    <p className="text-xs text-dark/40 dark:text-cream/40">טוען...</p>
                  ) : (
                    <div className="max-h-52 overflow-y-auto border border-line rounded-lg p-2 space-y-3">
                      {(["DOMAIN_MANAGER", "AREA_MANAGER"] as const).map((roleKey) => {
                        const group = managers.filter((m) => m.role === roleKey);
                        if (!group.length) return null;
                        return (
                          <div key={roleKey}>
                            <p className="text-[10px] font-semibold text-dark/40 dark:text-cream/40 uppercase tracking-wide px-1 mb-1">
                              {roleKey === "DOMAIN_MANAGER" ? "מנהלי תחום" : "מנהלי איזור"}
                            </p>
                            <div className="space-y-1">
                              {group.map((m) => {
                                const checked = selectedIds.has(m.id);
                                return (
                                  <label
                                    key={m.id}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${checked ? "bg-gold/10 border border-gold/30" : "hover:bg-offwhite dark:hover:bg-dark-soft border border-transparent"}`}
                                  >
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${checked ? "bg-gold border-gold" : "border-dark/30 dark:border-cream/30"}`}>
                                      {checked && <Check size={11} className="text-dark" strokeWidth={3} />}
                                    </div>
                                    <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggleManager(m.id)} />
                                    <span className="text-sm text-dark dark:text-cream">{m.fullName}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <label className="label">יעד זמן (ימים) — {days}</label>
                  <input
                    type="range"
                    min={3}
                    max={90}
                    step={1}
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                    className="w-full accent-gold"
                  />
                  <div className="flex justify-between text-xs text-dark/40 dark:text-cream/40 mt-1">
                    <span>3 ימים</span>
                    <span>90 ימים</span>
                  </div>
                </div>

                <div>
                  <label className="label">הערה (אופציונלי)</label>
                  <textarea
                    className="input resize-none"
                    rows={2}
                    placeholder="הוראות מיוחדות..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary w-full justify-center"
                  disabled={loading || selectedIds.size === 0}
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                  {loading ? "מקצה..." : selectedIds.size === 0 ? "בחר לפחות מנהל אחד" : `הקצה (${selectedIds.size})`}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
