"use client";
import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";

export default function EditDeadlineButton({
  assignmentId,
  currentDays,
}: {
  assignmentId: string;
  currentDays: number;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentDays);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    const res = await fetch(`/api/assignments/${assignmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deadlineDays: value }),
    });
    setLoading(false);
    if (res.ok) {
      setEditing(false);
      window.location.reload();
    }
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="text-dark/30 dark:text-cream/30 hover:text-gold transition-colors"
        title="שנה יעד ימים"
      >
        <Pencil size={13} />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        min={1}
        max={365}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="input w-16 text-sm py-0.5 px-2 h-7"
        autoFocus
      />
      <span className="text-xs text-dark/40 dark:text-cream/40">ימים</span>
      <button
        onClick={save}
        disabled={loading}
        className="text-emerald-500 hover:text-emerald-400 disabled:opacity-50"
      >
        <Check size={15} />
      </button>
      <button onClick={() => { setEditing(false); setValue(currentDays); }} className="text-dark/30 dark:text-cream/30 hover:text-dark dark:hover:text-cream">
        <X size={15} />
      </button>
    </div>
  );
}
