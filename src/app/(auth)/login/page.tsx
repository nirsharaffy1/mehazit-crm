import { Metadata } from "next";
import LoginForm from "@/components/features/LoginForm";

export const metadata: Metadata = { title: "כניסה" };

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <p className="font-display text-2xl text-gold font-semibold">מהחזית אל הבית</p>
          <p className="text-cream/50 text-sm mt-1">מערכת ניהול פנימית</p>
        </div>

        <div className="card p-6">
          <h1 className="text-lg font-display font-semibold text-cream mb-5 text-center">
            כניסה למערכת
          </h1>
          <LoginForm />
          <div className="mt-4 text-center">
            <a
              href="/forgot-password"
              className="text-sm text-gold/70 hover:text-gold transition-colors"
            >
              שכחתי סיסמה
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
