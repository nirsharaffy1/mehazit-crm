"use client";
import { useState } from "react";
import { Users, Plus, Loader2, CheckCircle, Phone } from "lucide-react";

interface Resident {
  id: string;
  fullName: string;
  phone: string;
  apartment: string | null;
  building: string | null;
  signedPoA: boolean;
  notes: string | null;
}

interface Props {
  complexId: string;
  initialResidents: Resident[];
  canEdit: boolean;
}

const emptyForm = {
  fullName: "", phone: "", apartment: "", building: "", signedPoA: false, notes: "",
};

export default function ResidentContacts({ complexId, initialResidents, canEdit }: Props) {
  const [residents, setResidents] = useState(initialResidents);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  function update(k: string, v: string | boolean) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/complexes/${complexId}/residents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const resident = await res.json();
      setResidents((prev) => [...prev, resident]);
      setForm(emptyForm);
      setShowForm(false);
    }
    setLoading(false);
  }

  async function togglePoA(resident: Resident) {
    setToggling(resident.id);
    const res = await fetch(`/api/complexes/${complexId}/residents`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ residentId: resident.id, signedPoA: !resident.signedPoA }),
    });
    if (res.ok) {
      const updated = await res.json();
      setResidents((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    }
    setToggling(null);
  }

  const signed = residents.filter((r) => r.signedPoA).length;

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="section-title flex items-center gap-2">
          <Users size={16} className="text-gold" /> אנשי קשר ({residents.length})
          {residents.length > 0 && (
            <span className="badge badge-gray text-xs">{signed} חתמו יפ&quot;כ</span>
          )}
        </h2>
        {canEdit && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="btn-ghost text-xs flex items-center gap-1"
          >
            <Plus size={13} /> הוסף דייר
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={submit} className="mb-4 space-y-3 p-3 rounded-lg bg-offwhite dark:bg-dark-soft border border-line">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">שם מלא *</label>
              <input className="input" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} required />
            </div>
            <div>
              <label className="label">טלפון *</label>
              <input className="input" dir="ltr" value={form.phone} onChange={(e) => update("phone", e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">דירה</label>
              <input className="input" value={form.apartment} onChange={(e) => update("apartment", e.target.value)} />
            </div>
            <div>
              <label className="label">בניין</label>
              <input className="input" value={form.building} onChange={(e) => update("building", e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">הערות</label>
            <input className="input" value={form.notes} onChange={(e) => update("notes", e.target.value)} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 accent-gold" checked={form.signedPoA} onChange={(e) => update("signedPoA", e.target.checked)} />
            <span className="text-sm text-dark dark:text-cream">חתם/חתמה על יפוי כוח</span>
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="btn-primary text-sm">
              {loading ? <Loader2 size={14} className="animate-spin" /> : null} שמור
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-ghost text-sm">ביטול</button>
          </div>
        </form>
      )}

      {residents.length === 0 ? (
        <p className="muted text-center py-6">אין אנשי קשר עדיין</p>
      ) : (
        <div className="divide-y divide-line">
          {residents.map((r) => (
            <div key={r.id} className="flex items-center gap-3 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-dark dark:text-cream">{r.fullName}</p>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-dark/40 dark:text-cream/40">
                  <span className="flex items-center gap-1 ltr"><Phone size={10} /> {r.phone}</span>
                  {r.apartment && <span>דירה {r.apartment}</span>}
                  {r.building && <span>בניין {r.building}</span>}
                </div>
                {r.notes && <p className="text-xs text-dark/50 dark:text-cream/50 mt-0.5 italic">{r.notes}</p>}
              </div>
              <button
                onClick={() => canEdit && togglePoA(r)}
                disabled={toggling === r.id || !canEdit}
                title="יפוי כוח"
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors ${
                  r.signedPoA
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                    : "bg-offwhite dark:bg-dark-soft border border-line text-dark/40 dark:text-cream/40"
                } ${canEdit ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
              >
                <CheckCircle size={12} />
                {r.signedPoA ? "חתם יפ\"כ" : "טרם חתם"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
