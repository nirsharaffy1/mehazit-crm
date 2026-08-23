"use client";
import { useState } from "react";
import { X, Pencil } from "lucide-react";
import { ROLE_LABELS } from "@/types";

interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  domainId: string | null;
  isActive: boolean;
  weeklyVisitTarget: number;
  lastLoginAt: Date | null;
  domain: { id: string; name: string } | null;
}

interface Domain {
  id: string;
  name: string;
}

interface Props {
  user: User;
  domains: Domain[];
  onSaved: (updated: User) => void;
}

export default function EditUserModal({ user, domains, onSaved }: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    fullName: user.fullName,
    email: user.email,
    phone: user.phone ?? "",
    role: user.role,
    domainId: user.domainId ?? "",
    isActive: user.isActive,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function set(k: string, v: string | boolean) {
    setForm(f => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, domainId: form.domainId || null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "שגיאה"); return; }
      onSaved(data);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-dark/30 dark:text-cream/30 hover:text-gold transition-colors"
        title="עריכה"
      >
        <Pencil size={14} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative w-full max-w-md card p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-dark dark:text-cream">עריכת משתמש</h2>
              <button onClick={() => setOpen(false)} className="text-dark/30 dark:text-cream/30 hover:text-dark dark:hover:text-cream">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="form-label">שם מלא</label>
                  <input value={form.fullName} onChange={e => set("fullName", e.target.value)} className="input w-full" required />
                </div>
                <div className="col-span-2">
                  <label className="form-label">אימייל</label>
                  <input type="email" value={form.email} onChange={e => set("email", e.target.value)} className="input w-full" required />
                </div>
                <div>
                  <label className="form-label">טלפון</label>
                  <input value={form.phone} onChange={e => set("phone", e.target.value)} className="input w-full" />
                </div>
                <div>
                  <label className="form-label">תפקיד</label>
                  <select value={form.role} onChange={e => set("role", e.target.value)} className="input w-full">
                    {Object.entries(ROLE_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="form-label">תחום</label>
                  <select value={form.domainId} onChange={e => set("domainId", e.target.value)} className="input w-full">
                    <option value="">ללא תחום</option>
                    {domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={form.isActive}
                    onChange={e => set("isActive", e.target.checked)}
                    className="w-4 h-4 accent-gold"
                  />
                  <label htmlFor="isActive" className="text-sm text-dark dark:text-cream">משתמש פעיל</label>
                </div>
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                  {loading ? "שומר..." : "שמור שינויים"}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="btn-ghost flex-1">ביטול</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
