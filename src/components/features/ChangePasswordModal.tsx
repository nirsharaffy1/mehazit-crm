"use client";
import { useState } from "react";
import { X, KeyRound, Eye, EyeOff } from "lucide-react";

export default function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (next !== confirm) { setError("הסיסמאות החדשות אינן תואמות"); return; }
    if (next.length < 6) { setError("סיסמה חייבת להיות לפחות 6 תווים"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/me/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current, next }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "שגיאה"); return; }
      setSuccess(true);
      setTimeout(onClose, 1500);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative w-full max-w-sm card p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <KeyRound size={18} className="text-gold" />
            <h2 className="font-semibold text-dark dark:text-cream">שינוי סיסמה</h2>
          </div>
          <button onClick={onClose} className="text-dark/30 dark:text-cream/30 hover:text-dark dark:hover:text-cream">
            <X size={18} />
          </button>
        </div>

        {success ? (
          <p className="text-center text-green-500 py-4">הסיסמה שונתה בהצלחה ✓</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label">סיסמה נוכחית</label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={current}
                  onChange={e => setCurrent(e.target.value)}
                  className="input w-full pl-10"
                  required
                />
                <button type="button" onClick={() => setShowCurrent(s => !s)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-dark/30 dark:text-cream/30">
                  {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label className="form-label">סיסמה חדשה</label>
              <div className="relative">
                <input
                  type={showNext ? "text" : "password"}
                  value={next}
                  onChange={e => setNext(e.target.value)}
                  className="input w-full pl-10"
                  required
                  minLength={6}
                />
                <button type="button" onClick={() => setShowNext(s => !s)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-dark/30 dark:text-cream/30">
                  {showNext ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label className="form-label">אישור סיסמה חדשה</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className="input w-full"
                required
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "שומר..." : "שמור סיסמה"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
