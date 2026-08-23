"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
      <p className="text-4xl mb-4">📶</p>
      <h1 className="text-xl font-bold text-dark dark:text-cream mb-2">אין חיבור לאינטרנט</h1>
      <p className="text-sm text-dark/50 dark:text-cream/50 mb-6">
        הדפים האחרונים שביקרת בהם זמינים לצפייה. עדכונים חדשים יסונכרנו כשהחיבור יחזור.
      </p>
      <button
        onClick={() => window.history.back()}
        className="btn-ghost text-sm"
      >
        חזרה
      </button>
    </div>
  );
}
