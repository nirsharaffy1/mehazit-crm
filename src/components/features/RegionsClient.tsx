"use client";
import { useState } from "react";
import { Pencil, Trash2, Plus, Check, X, Loader2 } from "lucide-react";

interface DomainManager { id: string; fullName: string }
interface Domain {
  id: string;
  name: string;
  _count: { users: number; complexes: number };
  users: DomainManager[];
}

export default function RegionsClient({ domains: initial }: { domains: Domain[] }) {
  const [domains, setDomains] = useState(initial);
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  async function saveName(id: string) {
    setLoading(true);
    await fetch(`/api/regions/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: editName }) });
    setDomains(d => d.map(x => x.id === id ? { ...x, name: editName } : x));
    setEditing(null);
    setLoading(false);
  }

  async function addDomain() {
    if (!newName.trim()) return;
    setLoading(true);
    const res = await fetch("/api/regions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newName }) });
    const { domain } = await res.json();
    setDomains(d => [...d, { ...domain, _count: { users: 0, complexes: 0 } }]);
    setNewName("");
    setAdding(false);
    setLoading(false);
  }

  async function deleteDomain(id: string, name: string, usersCount: number, complexesCount: number) {
    const hasLinks = usersCount > 0 || complexesCount > 0;
    const msg = hasLinks
      ? `למחוק את התחום "${name}"?\nשים לב: ${usersCount > 0 ? `${usersCount} משתמשים` : ""}${usersCount > 0 && complexesCount > 0 ? " ו-" : ""}${complexesCount > 0 ? `${complexesCount} מתחמים` : ""} מקושרים אליו ויאבדו את שיוך התחום.`
      : `למחוק את התחום "${name}"?`;
    if (!confirm(msg)) return;
    const res = await fetch(`/api/regions/${id}`, { method: "DELETE" });
    if (res.ok) setDomains(d => d.filter(x => x.id !== id));
  }

  return (
    <div className="space-y-3">
      {domains.map(d => (
        <div key={d.id} className="card p-4 flex items-center gap-3">
          {editing === d.id ? (
            <>
              <input
                className="input flex-1"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && saveName(d.id)}
                autoFocus
              />
              <button onClick={() => saveName(d.id)} className="btn-primary p-2" disabled={loading}>
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              </button>
              <button onClick={() => setEditing(null)} className="btn-ghost p-2"><X size={14} /></button>
            </>
          ) : (
            <>
              <div className="flex-1">
                <p className="font-medium text-dark dark:text-cream">{d.name}</p>
                <p className="text-xs text-dark/40 dark:text-cream/40">
                  {d.users.length > 0
                    ? d.users.map(u => u.fullName).join(", ")
                    : "ללא מנהל תחום"}
                  {" · "}{d._count.complexes} מתחמים · {d._count.users} משתמשים
                </p>
              </div>
              <button onClick={() => { setEditing(d.id); setEditName(d.name); }} className="btn-ghost p-2 text-dark/50 hover:text-dark dark:text-cream/50 dark:hover:text-cream">
                <Pencil size={15} />
              </button>
              <button
                onClick={() => deleteDomain(d.id, d.name, d._count.users, d._count.complexes)}
                className="btn-ghost p-2 text-red-500 hover:bg-red-500/10 border-red-200 dark:border-red-900"
                title="מחיקת תחום"
              >
                <Trash2 size={15} />
              </button>
            </>
          )}
        </div>
      ))}

      {adding ? (
        <div className="card p-4 flex items-center gap-3 border-dashed border-gold/40">
          <input
            className="input flex-1"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="שם תחום חדש..."
            onKeyDown={e => e.key === "Enter" && addDomain()}
            autoFocus
          />
          <button onClick={addDomain} className="btn-primary p-2" disabled={loading}>
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          </button>
          <button onClick={() => setAdding(false)} className="btn-ghost p-2"><X size={14} /></button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="btn-ghost w-full justify-center border-dashed">
          <Plus size={16} /> הוסף תחום
        </button>
      )}
    </div>
  );
}
