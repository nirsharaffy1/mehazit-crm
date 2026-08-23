"use client";
import { useState } from "react";
import { Copy, Check, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const APP_URL = "https://app.mehazit.co.il";
const INITIAL_PASSWORD = "Mehazit2024!";

function buildMessage(fullName: string, email: string): string {
  const firstName = fullName.split(" ")[0];
  return `שלום ${firstName},

*ניהול פינוי בינוי — מהחזית אל הבית*
שמחים לשתף אותך במערכת הניהול החדשה — כלי פשוט שנותן לכולנו תמונה עדכנית בזמן אמת על המתחמים, הביקורים והיעדים, בלי מסרונים ידניים.

🔗 הקישור: ${APP_URL}
📧 האימייל שלך: ${email}
🔑 הסיסמה הראשונית: ${INITIAL_PASSWORD}
(מומלץ לשנות אחרי הכניסה הראשונה)

📲 *הכי נוח — להתקין כאפליקציה במסך הבית:*
באנדרואיד: פותחים את הקישור ← תפריט ⋮ למעלה ← "הוספה למסך הבית".
באייפון: פותחים את הקישור ← כפתור השיתוף (ריבוע עם חץ) ← "הוסף למסך הבית".

*מה עושים?*
• אחרי כל ביקור במתחם — פותחים את המתחם ולוחצים "ביקור חדש".
• ממלאים: תאריך, רמת היענות הדיירים, כמה נפגשתם, חתימות יפ"כ חדשות, ואם יש דיירי עמידר/עמיגור.
• יש יעד ימים לכל מתחם — ספירה לאחור מדויקת.
• שבוע לפני סיום היעד תקבל תזכורת.

בהצלחה!`;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border transition-colors",
        copied
          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
          : "bg-white/5 border-white/10 text-dark/70 dark:text-cream/70 hover:bg-white/10 hover:border-white/20"
      )}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? "הועתק!" : label}
    </button>
  );
}

function WhatsAppButton({ phone, message }: { phone?: string | null; message: string }) {
  const encoded = encodeURIComponent(message);
  const number = phone ? phone.replace(/\D/g, "").replace(/^0/, "972") : "";
  const href = number
    ? `https://wa.me/${number}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-[#25D366] hover:bg-[#1ebe5d] text-white transition-colors"
    >
      <MessageCircle size={14} />
      WhatsApp
    </a>
  );
}

import type { UserRow, DomainGroup } from "@/types/login-links";
export type { UserRow, DomainGroup };

interface Props {
  admins: UserRow[];
  domains: DomainGroup[];
  inactive: UserRow[];
  unassigned: UserRow[];
}

function UserRowItem({ user }: { user: UserRow }) {
  const message = buildMessage(user.fullName, user.email);
  return (
    <div className="flex items-center gap-3 py-3 border-b border-dark/5 dark:border-cream/5 last:border-0 flex-wrap">
      <span className="font-medium text-dark dark:text-cream min-w-[8rem] flex-shrink-0">
        {user.fullName}
      </span>
      <span className="text-xs text-dark/40 dark:text-cream/40 flex-1 min-w-[12rem] font-mono ltr">
        {APP_URL}
      </span>
      <div className="flex items-center gap-2 flex-wrap">
        <CopyButton text={APP_URL} label="העתקת קישור" />
        <CopyButton text={message} label="העתקת הודעה" />
        <WhatsAppButton phone={user.phone} message={message} />
      </div>
    </div>
  );
}

export default function LoginLinksClient({ admins, domains, inactive, unassigned }: Props) {
  const [showInactive, setShowInactive] = useState(false);

  return (
    <div className="space-y-6">
      {/* Description */}
      <div className="card p-4 text-sm text-dark/60 dark:text-cream/60 leading-relaxed">
        כל משתמש מקבל קישור ישיר למערכת ושירות להיכנס בלי מסך כניסה — שלחו את הקישור ב-WhatsApp
        או העתיקו אותו.{" "}
        <span className="text-gold font-medium">
          שימו לב: לרכז ולהנהלה הקישור עקרי — לשלוח רק לאחר הכניסה דרך הקישור עצמם.
        </span>
      </div>

      {/* Admins */}
      <section>
        <h2 className="text-xs font-semibold text-dark/40 dark:text-cream/40 uppercase tracking-wider mb-2 px-1">
          מנהלים כלליים
        </h2>
        <div className="card px-4">
          {admins.map((u) => <UserRowItem key={u.id} user={u} />)}
        </div>
      </section>

      {/* Per domain */}
      {domains.map((d) => (
        <section key={d.domainName}>
          <h2 className="text-xs font-semibold text-gold uppercase tracking-wider mb-2 px-1">
            תחום {d.domainName}
          </h2>
          <div className="card px-4">
            {d.domainManager && (
              <>
                <p className="text-[11px] text-dark/30 dark:text-cream/30 pt-3 pb-1 font-medium">מנהל תחום</p>
                <UserRowItem user={d.domainManager} />
                {d.areaManagers.length > 0 && (
                  <p className="text-[11px] text-dark/30 dark:text-cream/30 pt-3 pb-1 font-medium">מנהלי אזור</p>
                )}
              </>
            )}
            {d.areaManagers.map((u) => <UserRowItem key={u.id} user={u} />)}
          </div>
        </section>
      ))}

      {/* Unassigned */}
      {unassigned.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-2 px-1">
            ללא תחום ({unassigned.length})
          </h2>
          <div className="card px-4">
            {unassigned.map((u) => <UserRowItem key={u.id} user={u} />)}
          </div>
        </section>
      )}

      {/* Inactive */}
      {inactive.length > 0 && (
        <section>
          <button
            onClick={() => setShowInactive((v) => !v)}
            className="text-xs font-semibold text-dark/30 dark:text-cream/30 uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5 hover:text-dark/50 dark:hover:text-cream/50 transition-colors"
          >
            <span>{showInactive ? "▾" : "▸"}</span>
            משתמשים מושבתים ({inactive.length})
          </button>
          {showInactive && (
            <div className="card px-4 opacity-60">
              {inactive.map((u) => <UserRowItem key={u.id} user={u} />)}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
