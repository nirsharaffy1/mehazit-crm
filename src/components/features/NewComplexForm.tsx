"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface Domain { id: string; name: string }

export default function NewComplexForm({ domains }: { domains: Domain[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", address: "", city: "", domainId: "",
    gush: "", helka: "", unitCount: "", buildingCount: "",
    developerName: "", description: "", lat: "", lng: "",
  });

  function update(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/complexes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const { complex } = await res.json();
    router.push(`/complexes/${complex.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="label">שם המתחם *</label>
          <input className="input" value={form.name} onChange={e => update("name", e.target.value)} required placeholder="מתחם רחוב הרצל..." />
        </div>
        <div>
          <label className="label">תחום</label>
          <select className="input" value={form.domainId} onChange={e => update("domainId", e.target.value)}>
            <option value="">ללא תחום</option>
            {domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="label">כתובת *</label>
        <input className="input" value={form.address} onChange={e => update("address", e.target.value)} required placeholder="רחוב הרצל 1" />
      </div>

      <div>
        <label className="label">עיר *</label>
        <input className="input" value={form.city} onChange={e => update("city", e.target.value)} required placeholder="תל אביב" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="label">גוש</label>
          <input className="input" value={form.gush} onChange={e => update("gush", e.target.value)} dir="ltr" />
        </div>
        <div>
          <label className="label">חלקה</label>
          <input className="input" value={form.helka} onChange={e => update("helka", e.target.value)} dir="ltr" />
        </div>
        <div>
          <label className="label">יחידות דיור</label>
          <input type="number" min="0" className="input" value={form.unitCount} onChange={e => update("unitCount", e.target.value)} dir="ltr" />
        </div>
        <div>
          <label className="label">בניינים</label>
          <input type="number" min="0" className="input" value={form.buildingCount} onChange={e => update("buildingCount", e.target.value)} dir="ltr" />
        </div>
      </div>

      <div>
        <label className="label">שם יזם</label>
        <input className="input" value={form.developerName} onChange={e => update("developerName", e.target.value)} />
      </div>

      <div>
        <label className="label">תיאור / הערות</label>
        <textarea className="input resize-none" rows={3} value={form.description} onChange={e => update("description", e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">קו רוחב (lat) <span className="text-dark/30 dark:text-cream/30 font-normal text-xs">— לתצוגה במפה</span></label>
          <input type="number" step="any" className="input" value={form.lat} onChange={e => update("lat", e.target.value)} dir="ltr" placeholder="31.7683" />
        </div>
        <div>
          <label className="label">קו אורך (lng)</label>
          <input type="number" step="any" className="input" value={form.lng} onChange={e => update("lng", e.target.value)} dir="ltr" placeholder="35.2137" />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : null}
          {loading ? "יוצר..." : "צור מתחם"}
        </button>
        <a href="/complexes" className="btn-ghost">ביטול</a>
      </div>
    </form>
  );
}
