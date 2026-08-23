import { Metadata } from "next";

export const metadata: Metadata = { title: "שכחתי סיסמה" };

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="font-display text-2xl text-gold font-semibold">מהחזית אל הבית</p>
        </div>
        <div className="card p-6">
          <h1 className="text-lg font-display font-semibold text-cream mb-2 text-center">
            איפוס סיסמה
          </h1>
          <p className="text-sm text-cream/50 text-center mb-5">
            לאיפוס סיסמה, צור קשר עם מנהל המערכת
          </p>
          <div className="bg-gold/10 border border-gold/20 rounded-lg p-4 text-center">
            <p className="text-sm text-gold">ניר שרפי</p>
            <a
              href="https://wa.me/972XXXXXXXXX"
              className="text-sm text-cream/60 hover:text-gold transition-colors"
            >
              וואטסאפ
            </a>
          </div>
          <div className="mt-4 text-center">
            <a href="/login" className="text-sm text-gold/70 hover:text-gold transition-colors">
              ← חזרה לכניסה
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
