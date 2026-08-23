"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ExternalLink } from "lucide-react";

interface Domain { id: string; name: string }
interface Complex {
  id: string; name: string; address: string; city: string; domainId: string | null;
  gush: string | null; helka: string | null; unitCount: number | null;
  buildingCount: number | null; developerName: string | null; description: string | null;
  lat: number | null; lng: number | null;
}

export default function EditComplexForm({ complex, domains }: { complex: Complex; domains: Domain[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: complex.name,
    address: complex.address,
    city: complex.city,
    domainId: complex.domainId ?? "",
    gush: complex.gush ?? "",
    helka: complex.helka ?? "",
    unitCount: complex.unitCount?.toString() ?? "",
    buildingCount: complex.buildingCount?.toString() ?? "",
    developerName: complex.developerName ?? "",
    description: complex.description ?? "",
    lat: complex.lat?.toString() ?? "",
    lng: complex.lng?.toString() ?? "",
  });

  function update(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  function openGoogleMapsSearch() {
    const q = encodeURIComponent(`${form.address} ${form.city} Israel`);
    window.open(`https://www.google.com/maps/search/${q}`, "_blank");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch(`/api/complexes/${complex.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    router.push(`/complexes/${complex.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="label">שם המתחם *</label>
          <input className="input" value={form.name} onChange={e => update("name", e.target.value)} required />
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
        <input className="input" value={form.address} onChange={e => update("address", e.target.value)} required />
      </div>
      <div>
        <label className="label">עיר *</label>
        <input className="input" value={form.city} onChange={e => update("city", e.target.value)} required />
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
          <label className="label">יחידות</label>
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

      {/* Coordinates */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="label mb-0">קואורדינטות (לתצוגה במפה)</label>
          <button type="button" onClick={openGoogleMapsSearch}
            className="text-xs text-gold hover:underline flex items-center gap-1">
            <ExternalLink size={11} /> מצא ב-Google Maps
          </button>
        </div>
        <p className="text-xs text-dark/40 dark:text-cream/40">
          פתח Google Maps, לחץ ימני על המיקום המדויק של המתחם ← &quot;מה יש כאן?&quot; — הקואורדינטות יופיעו למטה
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label text-xs">קו רוחב (lat)</label>
            <input type="number" step="any" className="input" value={form.lat}
              onChange={e => update("lat", e.target.value)} dir="ltr" placeholder="31.7683" />
          </div>
          <div>
            <label className="label text-xs">קו אורך (lng)</label>
            <input type="number" step="any" className="input" value={form.lng}
              onChange={e => update("lng", e.target.value)} dir="ltr" placeholder="35.2137" />
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : null}
          {loading ? "שומר..." : "שמור שינויים"}
        </button>
        <a href={`/complexes/${complex.id}`} className="btn-ghost">ביטול</a>
      </div>
    </form>
  );
}
