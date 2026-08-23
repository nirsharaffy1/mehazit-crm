"use client";
import { useState } from "react";
import { Check, X, Pencil } from "lucide-react";

interface Props {
  userId: string;
  initialTarget: number;
  visitsThisWeek: number;
}

export default function WeeklyTargetCell({ userId, initialTarget, visitsThisWeek }: Props) {
  const [target, setTarget] = useState(initialTarget);
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(String(initialTarget));
  const [saving, setSaving] = useState(false);

  async function save() {
    const val = parseInt(input, 10);
    if (isNaN(val) || val < 0) return;
    setSaving(true);
    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weeklyVisitTarget: val }),
    });
    if (res.ok) setTarget(val);
    setEditing(false);
    setSaving(false);
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          autoFocus
          type="number"
          min="0"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
          className="w-12 text-center text-xs border border-gold rounded p-0.5 bg-transparent text-dark dark:text-cream focus:outline-none"
          dir="ltr"
        />
        <button onClick={save} disabled={saving} className="text-emerald-500 hover:text-emerald-400"><Check size={13} /></button>
        <button onClick={() => setEditing(false)} className="text-dark/30 dark:text-cream/30 hover:text-red-400"><X size={13} /></button>
      </div>
    );
  }

  const pct = target > 0 ? Math.min(100, Math.round((visitsThisWeek / target) * 100)) : 0;
  const color = pct >= 100 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-400";

  return (
    <div className="flex items-center gap-2">
      <div>
        <div className="flex items-center gap-1 text-xs">
          <span className="text-dark dark:text-cream font-medium">{visitsThisWeek}</span>
          <span className="text-dark/30 dark:text-cream/30">/</span>
          <span className="text-dark/50 dark:text-cream/50">{target}</span>
        </div>
        {target > 0 && (
          <div className="w-14 h-1 bg-dark/10 dark:bg-cream/10 rounded-full mt-0.5">
            <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>
      <button
        onClick={() => { setInput(String(target)); setEditing(true); }}
        className="text-dark/20 dark:text-cream/20 hover:text-gold transition-colors opacity-0 group-hover:opacity-100"
      >
        <Pencil size={11} />
      </button>
    </div>
  );
}
