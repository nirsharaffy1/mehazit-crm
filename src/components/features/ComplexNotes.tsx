"use client";
import { useState } from "react";
import { MessageSquare, Loader2, Plus } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Note {
  id: string;
  content: string;
  createdAt: string;
  user: { fullName: string };
}

interface Props {
  complexId: string;
  initialNotes: Note[];
}

export default function ComplexNotes({ complexId, initialNotes }: Props) {
  const [notes, setNotes] = useState(initialNotes);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/complexes/${complexId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text.trim() }),
    });
    if (res.ok) {
      const note = await res.json();
      setNotes((prev) => [note, ...prev]);
      setText("");
      setShowForm(false);
    }
    setLoading(false);
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="section-title flex items-center gap-2">
          <MessageSquare size={16} className="text-gold" /> הערות פנימיות ({notes.length})
        </h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="btn-ghost text-xs flex items-center gap-1"
        >
          <Plus size={13} /> הוסף הערה
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="mb-4">
          <textarea
            autoFocus
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="כתוב הערה פנימית על המתחם..."
            className="input resize-none w-full mb-2"
          />
          <div className="flex gap-2">
            <button type="submit" disabled={loading || !text.trim()} className="btn-primary text-sm">
              {loading ? <Loader2 size={14} className="animate-spin" /> : null}
              שמור
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-ghost text-sm">
              ביטול
            </button>
          </div>
        </form>
      )}

      {notes.length === 0 ? (
        <p className="muted text-center py-6">אין הערות עדיין</p>
      ) : (
        <div className="space-y-3">
          {notes.map((n) => (
            <div key={n.id} className="p-3 rounded-lg bg-offwhite dark:bg-dark-soft border border-line">
              <p className="text-sm text-dark dark:text-cream whitespace-pre-wrap">{n.content}</p>
              <p className="text-xs text-dark/40 dark:text-cream/40 mt-1.5">
                {n.user.fullName} · {formatDate(new Date(n.createdAt))}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
