"use client";
import { useState } from "react";
import { X, Loader2, Plus, Copy, Wand2 } from "lucide-react";
import { EngagementLevel, ENGAGEMENT_LABELS } from "@/types";

const ENGAGEMENT_OPTIONS: EngagementLevel[] = ["HIGH", "MEDIUM", "LOW", "NO_CONTACT"];

const TEMPLATES = [
  { label: "ביקור ראשון", engagement: "HIGH" as EngagementLevel, residentsMetCount: "3", newSignatures: "0", hasAmidorAmigur: false, notes: "ביקור היכרות ראשוני עם הדיירים. הצגנו את הפרויקט ואת ההטבות." },
  { label: "אסיפת דיירים", engagement: "HIGH" as EngagementLevel, residentsMetCount: "15", newSignatures: "2", hasAmidorAmigur: false, notes: "קיימנו אסיפת דיירים מסודרת. הצגנו את תוכנית הבנייה." },
  { label: "קשה לתאם", engagement: "NO_CONTACT" as EngagementLevel, residentsMetCount: "0", newSignatures: "0", hasAmidorAmigur: false, notes: "לא הצלחנו לתאם פגישה עם הדיירים. ננסה שוב בשבוע הבא." },
  { label: "ביקור שגרתי", engagement: "MEDIUM" as EngagementLevel, residentsMetCount: "2", newSignatures: "0", hasAmidorAmigur: false, notes: "ביקור שגרתי לעדכון סטטוס. אין חדשות מיוחדות." },
];

interface LastVisit {
  engagement: EngagementLevel;
  residentsMetCount: number | null;
  newSignatures: number;
  hasAmidorAmigur: boolean;
  notes: string | null;
}

export default function AddVisitModal({ complexId, lastVisit }: { complexId: string; lastVisit?: LastVisit }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [form, setForm] = useState({
    visitDate: new Date().toISOString().split("T")[0],
    engagement: "HIGH" as EngagementLevel,
    residentsMetCount: "",
    newSignatures: "0",
    hasAmidorAmigur: false,
    notes: "",
    nextVisitDate: "",
    photoUrl: "",
  });

  function update(k: string, v: string | boolean) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function applyTemplate(t: typeof TEMPLATES[0]) {
    setForm((f) => ({
      ...f,
      engagement: t.engagement,
      residentsMetCount: t.residentsMetCount,
      newSignatures: t.newSignatures,
      hasAmidorAmigur: t.hasAmidorAmigur,
      notes: t.notes,
    }));
    setShowTemplates(false);
  }

  function copyLastVisit() {
    if (!lastVisit) return;
    setForm((f) => ({
      ...f,
      engagement: lastVisit.engagement,
      residentsMetCount: lastVisit.residentsMetCount?.toString() ?? "",
      newSignatures: lastVisit.newSignatures.toString(),
      hasAmidorAmigur: lastVisit.hasAmidorAmigur,
      notes: lastVisit.notes ?? "",
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        complexId,
        fileUrls: form.photoUrl.trim() ? [form.photoUrl.trim()] : [],
      }),
    });
    setLoading(false);
    setOpen(false);
    window.location.reload();
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary text-sm flex items-center gap-1.5">
        <Plus size={15} /> ביקור חדש
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="card w-full max-w-md p-5 relative my-4">
            <button onClick={() => setOpen(false)} className="absolute top-4 left-4 text-dark/40 dark:text-cream/40 hover:text-dark dark:hover:text-cream">
              <X size={18} />
            </button>

            <h2 className="section-title mb-3">רישום ביקור</h2>

            {/* Quick actions */}
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setShowTemplates((v) => !v)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-line hover:border-gold/50 text-dark/60 dark:text-cream/60 hover:text-gold transition-colors"
              >
                <Wand2 size={12} /> תבניות
              </button>
              {lastVisit && (
                <button
                  type="button"
                  onClick={copyLastVisit}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-line hover:border-gold/50 text-dark/60 dark:text-cream/60 hover:text-gold transition-colors"
                >
                  <Copy size={12} /> העתק מביקור אחרון
                </button>
              )}
            </div>

            {showTemplates && (
              <div className="mb-4 grid grid-cols-2 gap-2">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => applyTemplate(t)}
                    className="text-xs p-2.5 rounded-lg border border-line hover:border-gold bg-offwhite dark:bg-dark-soft text-dark dark:text-cream text-right transition-colors hover:bg-gold/5"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">תאריך ביקור</label>
                <input type="date" className="input" value={form.visitDate}
                  onChange={(e) => update("visitDate", e.target.value)} required dir="ltr" />
              </div>

              <div>
                <label className="label">היענות דיירים</label>
                <div className="grid grid-cols-2 gap-2">
                  {ENGAGEMENT_OPTIONS.map((lvl) => (
                    <button
                      type="button"
                      key={lvl}
                      onClick={() => update("engagement", lvl)}
                      className={`py-2 px-3 rounded-lg text-sm border transition-all ${
                        form.engagement === lvl
                          ? "border-gold bg-gold/15 text-gold font-medium"
                          : "border-line text-dark/60 dark:text-cream/60 hover:border-gold/50"
                      }`}
                    >
                      {ENGAGEMENT_LABELS[lvl]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">דיירים שנפגשו</label>
                  <input type="number" min="0" className="input" placeholder="0"
                    value={form.residentsMetCount}
                    onChange={(e) => update("residentsMetCount", e.target.value)} dir="ltr" />
                </div>
                <div>
                  <label className="label">חתימות חדשות (יפ&quot;כ)</label>
                  <input type="number" min="0" className="input" placeholder="0"
                    value={form.newSignatures}
                    onChange={(e) => update("newSignatures", e.target.value)} dir="ltr" />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-gold rounded"
                    checked={form.hasAmidorAmigur}
                    onChange={(e) => update("hasAmidorAmigur", e.target.checked)}
                  />
                  <span className="text-sm text-dark dark:text-cream">יש דיירי עמידר / עמיגור בבניין</span>
                </label>
              </div>

              <div>
                <label className="label">הערות</label>
                <textarea className="input resize-none" rows={3} placeholder="תאר את הביקור..."
                  value={form.notes} onChange={(e) => update("notes", e.target.value)} />
              </div>

              <div>
                <label className="label">קישור לתמונה (אופציונלי)</label>
                <input type="url" className="input" dir="ltr" placeholder="https://..."
                  value={form.photoUrl} onChange={(e) => update("photoUrl", e.target.value)} />
              </div>

              <div>
                <label className="label">תאריך ביקור הבא (אופציונלי)</label>
                <input type="date" className="input" value={form.nextVisitDate}
                  onChange={(e) => update("nextVisitDate", e.target.value)} dir="ltr" />
              </div>

              <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                {loading ? "שומר..." : "שמור ביקור"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
