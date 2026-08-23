"use client";
import { useState, useEffect } from "react";
import { X, Loader2, Plus } from "lucide-react";
import { ROLE_LABELS, CrmRole } from "@/types";

const ROLES: CrmRole[] = ["GENERAL_ADMIN", "DOMAIN_MANAGER", "AREA_MANAGER"];

export default function AddUserModal() {
  const [open, setOpen] = useState(false);
  const [domains, setDomains] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "", role: "AREA_MANAGER" as CrmRole, domainId: "" });

  useEffect(() => {
    if (open) {
      fetch("/api/regions").then(r => r.json()).then(d => setDomains(d.domains ?? []));
    }
  }, [open]);

  function update(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  const needsDomain = form.role === "DOMAIN_MANAGER" || form.role === "AREA_MANAGER";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) { setSuccess(true); setTimeout(() => { setOpen(false); setSuccess(false); window.location.reload(); }, 1500); }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary text-sm"><Plus size={16} /> משתמש חדש</button>

      {open && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-md p-5 relative">
            <button onClick={() => setOpen(false)} className="absolute top-4 left-4 text-dark/40 dark:text-cream/40 hover:text-dark dark:hover:text-cream"><X size={18} /></button>
            <h2 className="section-title mb-4">הוספת משתמש</h2>

            {success ? (
              <div className="text-center py-6">
                <p className="text-emerald-500 font-medium">המשתמש נוצר בהצלחה!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">שם מלא</label>
                  <input className="input" value={form.fullName} onChange={e => update("fullName", e.target.value)} required placeholder="ישראל ישראלי" />
                </div>
                <div>
                  <label className="label">אימייל</label>
                  <input type="email" className="input" value={form.email} onChange={e => update("email", e.target.value)} required dir="ltr" />
                </div>
                <div>
                  <label className="label">טלפון (לוואטסאפ)</label>
                  <input className="input" value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="05X-XXXXXXX" dir="ltr" />
                </div>
                <div>
                  <label className="label">סיסמה</label>
                  <input type="password" className="input" value={form.password} onChange={e => update("password", e.target.value)} required dir="ltr" minLength={8} />
                </div>
                <div>
                  <label className="label">תפקיד</label>
                  <select className="input" value={form.role} onChange={e => update("role", e.target.value as CrmRole)}>
                    {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  </select>
                </div>
                {needsDomain && (
                  <div>
                    <label className="label">תחום</label>
                    <select className="input" value={form.domainId} onChange={e => update("domainId", e.target.value)}>
                      <option value="">בחר תחום...</option>
                      {domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                )}
                <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
                  {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                  {loading ? "יוצר..." : "צור משתמש"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
