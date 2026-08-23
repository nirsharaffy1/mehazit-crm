"use client";
import { useState, useEffect } from "react";
import { X, Loader2, MessageCircle } from "lucide-react";
import { buildWhatsappUrl, assignmentWhatsappMessage } from "@/lib/utils";

interface AreaManager { id: string; fullName: string; phone: string | null; }

export default function AssignModal({ complexId, complexName }: {
  complexId: string;
  complexName: string;
}) {
  const [open, setOpen] = useState(false);
  const [managers, setManagers] = useState<AreaManager[]>([]);
  const [selectedManager, setSelectedManager] = useState("");
  const [days, setDays] = useState(30);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [assigned, setAssigned] = useState<{ manager: AreaManager; city: string } | null>(null);

  useEffect(() => {
    if (open) {
      fetch("/api/users?role=AREA_MANAGER")
        .then((r) => r.json())
        .then((d) => setManagers(d.users ?? []));
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/assignments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ complexId, userId: selectedManager, deadlineDays: days, note }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      const mgr = managers.find((m) => m.id === selectedManager)!;
      setAssigned({ manager: mgr, city: data.city ?? "" });
    }
  }

  function handleClose() {
    setOpen(false);
    setAssigned(null);
    setSelectedManager("");
    setDays(30);
    setNote("");
    if (assigned) window.location.reload();
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary text-sm">
        הקצה למנהל איזור
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-md p-5 relative">
            <button onClick={handleClose} className="absolute top-4 left-4 text-dark/40 dark:text-cream/40 hover:text-dark dark:hover:text-cream">
              <X size={18} />
            </button>

            <h2 className="section-title mb-4">{assigned ? "הוקצה בהצלחה!" : `הקצאת מתחם: ${complexName}`}</h2>

            {assigned ? (
              <div className="space-y-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 text-center">
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                    {complexName} הוקצה ל-{assigned.manager.fullName} לטיפול תוך {days} ימים
                  </p>
                </div>
                {assigned.manager.phone && (
                  <a
                    href={buildWhatsappUrl(
                      assigned.manager.phone,
                      assignmentWhatsappMessage(
                        assigned.manager.fullName,
                        complexName,
                        assigned.city,
                        days,
                        "מנהל התחום"
                      )
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary w-full justify-center"
                  >
                    <MessageCircle size={16} /> שלח הודעת וואטסאפ
                  </a>
                )}
                <button onClick={handleClose} className="btn-ghost w-full justify-center">סגור</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">מנהל איזור</label>
                  <select
                    className="input"
                    value={selectedManager}
                    onChange={(e) => setSelectedManager(e.target.value)}
                    required
                  >
                    <option value="">בחר מנהל איזור...</option>
                    {managers.map((m) => (
                      <option key={m.id} value={m.id}>{m.fullName}</option>
                    ))}
                  </select>
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

                <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
                  {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                  {loading ? "מקצה..." : "הקצה"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
