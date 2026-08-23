"use client";
import { useState } from "react";
import { Calendar, Clock, MapPin, Pencil, Check, X, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Props {
  complexId: string;
  initialDate: string | null;
  initialTime: string | null;
  initialLocation: string | null;
  canEdit: boolean;
}

export default function AssemblyDetails({ complexId, initialDate, initialTime, initialLocation, canEdit }: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(initialDate ? initialDate.slice(0, 10) : "");
  const [time, setTime] = useState(initialTime ?? "");
  const [location, setLocation] = useState(initialLocation ?? "");
  const [saved, setSaved] = useState({ date: initialDate, time: initialTime, location: initialLocation });

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/complexes/${complexId}/assembly`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assemblyDate: date || null,
          assemblyTime: time || null,
          assemblyLocation: location || null,
        }),
      });
      if (res.ok) {
        setSaved({ date: date ? new Date(date).toISOString() : null, time: time || null, location: location || null });
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setDate(saved.date ? saved.date.slice(0, 10) : "");
    setTime(saved.time ?? "");
    setLocation(saved.location ?? "");
    setEditing(false);
  }

  const hasData = saved.date || saved.time || saved.location;

  if (editing) {
    return (
      <div className="space-y-3 mt-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-dark/50 dark:text-cream/50 mb-1 block">תאריך</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="input w-full text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-dark/50 dark:text-cream/50 mb-1 block">שעה</label>
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="input w-full text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-dark/50 dark:text-cream/50 mb-1 block">מיקום</label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="כתובת / שם המקום..."
              className="input w-full text-sm"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={save} disabled={saving} className="btn-primary text-sm flex items-center gap-1.5">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            שמור
          </button>
          <button onClick={cancel} className="btn-ghost text-sm flex items-center gap-1.5">
            <X size={14} /> ביטול
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3">
      {hasData ? (
        <div className="flex flex-wrap items-center gap-4">
          {saved.date && (
            <span className="flex items-center gap-1.5 text-sm text-dark dark:text-cream">
              <Calendar size={14} className="text-gold" />
              {formatDate(new Date(saved.date))}
            </span>
          )}
          {saved.time && (
            <span className="flex items-center gap-1.5 text-sm text-dark dark:text-cream">
              <Clock size={14} className="text-gold" />
              {saved.time}
            </span>
          )}
          {saved.location && (
            <span className="flex items-center gap-1.5 text-sm text-dark dark:text-cream">
              <MapPin size={14} className="text-gold" />
              {saved.location}
            </span>
          )}
          {canEdit && (
            <button
              onClick={() => setEditing(true)}
              className="text-dark/30 dark:text-cream/30 hover:text-gold transition-colors"
              title="עריכת פרטי כנס"
            >
              <Pencil size={14} />
            </button>
          )}
        </div>
      ) : canEdit ? (
        <button
          onClick={() => setEditing(true)}
          className="btn-ghost text-sm flex items-center gap-1.5 border-dashed"
        >
          <Calendar size={14} /> הוסף פרטי כנס (תאריך, שעה, מיקום)
        </button>
      ) : (
        <p className="text-xs text-dark/30 dark:text-cream/30">פרטי הכנס טרם נקבעו</p>
      )}
    </div>
  );
}
