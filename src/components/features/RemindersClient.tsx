"use client";
import { useState } from "react";
import { MessageCircle, Check, Building2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ReminderRow {
  id: string;
  complexId: string;
  complexName: string;
  city: string;
  managerName: string;
  phone: string | null;
  deadlineAt: string;
  days: number;
  domainId: string | null;
  domainName: string;
}

interface Props {
  overdue: ReminderRow[];
  urgent: ReminderRow[];
  upcoming: ReminderRow[];
  isGeneralAdmin: boolean;
}

function buildMessage(managerName: string, complexName: string, city: string, days: number) {
  const firstName = managerName.split(" ")[0];
  if (days < 0) {
    return `שלום ${firstName},\n\n⚠️ *המתחם ${complexName}* ב${city} חרג מהיעד ב-${Math.abs(days)} ימים!\n\nאנא עדכן את הסטטוס במערכת בהקדם.`;
  }
  return `שלום ${firstName},\n\n⏰ תזכורת: נותרו *${days} ימים* לטיפול במתחם:\n📍 *${complexName}* — ${city}\n\nאנא עדכן את הסטטוס במערכת.`;
}

function ReminderRow({ row, sent, onSend }: { row: ReminderRow; sent: boolean; onSend: () => void }) {
  const isOverdue = row.days < 0;
  const phone = row.phone ? row.phone.replace(/\D/g, "").replace(/^0/, "972") : "";
  const message = buildMessage(row.managerName, row.complexName, row.city, row.days);
  const waUrl = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;

  return (
    <div className={cn(
      "flex items-center gap-3 py-3 border-b border-dark/5 dark:border-cream/5 last:border-0 flex-wrap",
      sent && "opacity-50"
    )}>
      <div className="flex-1 min-w-0">
        <Link href={`/complexes/${row.complexId}`} className="font-medium text-dark dark:text-cream hover:text-gold transition-colors">
          {row.complexName}
        </Link>
        <p className="text-xs text-dark/40 dark:text-cream/40 mt-0.5">
          {row.city} · {row.managerName}
          {row.phone && <span className="ltr ml-1">{row.phone}</span>}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className={cn("badge text-xs", isOverdue ? "badge-red" : "badge-gold")}>
          {isOverdue ? `חרג ב-${Math.abs(row.days)}י'` : `${row.days} ימים`}
        </span>
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onSend}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
            sent
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              : "bg-[#25D366] hover:bg-[#1ebe5d] text-white"
          )}
        >
          {sent ? <Check size={14} /> : <MessageCircle size={14} />}
          {sent ? "נשלח" : "שלח"}
        </a>
      </div>
    </div>
  );
}

function DomainGroup({ domain, rows, sent, onSend }: {
  domain: string;
  rows: ReminderRow[];
  sent: Set<string>;
  onSend: (id: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const sentCount = rows.filter((r) => sent.has(r.id)).length;

  return (
    <div className="mb-4">
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="flex items-center justify-between w-full mb-2 px-1 group"
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-dark/50 dark:text-cream/50 group-hover:text-gold transition-colors">
          {domain} ({rows.length})
        </span>
        <div className="flex items-center gap-2">
          {sentCount > 0 && (
            <span className="text-xs text-emerald-500">{sentCount}/{rows.length} נשלחו</span>
          )}
          {collapsed ? <ChevronDown size={14} className="text-dark/40 dark:text-cream/40" /> : <ChevronUp size={14} className="text-dark/40 dark:text-cream/40" />}
        </div>
      </button>
      {!collapsed && (
        <div className="card px-4">
          {rows.map((r) => (
            <ReminderRow key={r.id} row={r} sent={sent.has(r.id)} onSend={() => onSend(r.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function Section({ title, rows, color, sent, onSend, isGeneralAdmin }: {
  title: string;
  rows: ReminderRow[];
  color: string;
  sent: Set<string>;
  onSend: (id: string) => void;
  isGeneralAdmin: boolean;
}) {
  if (rows.length === 0) return null;

  if (isGeneralAdmin) {
    const byDomain = new Map<string, ReminderRow[]>();
    rows.forEach((r) => {
      const key = r.domainName;
      byDomain.set(key, [...(byDomain.get(key) ?? []), r]);
    });

    return (
      <section>
        <h2 className={cn("text-xs font-bold uppercase tracking-wider mb-3 px-1", color)}>
          {title} ({rows.length})
        </h2>
        {Array.from(byDomain.entries()).map(([domain, domainRows]) => (
          <DomainGroup key={domain} domain={domain} rows={domainRows} sent={sent} onSend={onSend} />
        ))}
      </section>
    );
  }

  return (
    <section>
      <h2 className={cn("text-xs font-semibold uppercase tracking-wider mb-2 px-1", color)}>
        {title} ({rows.length})
      </h2>
      <div className="card px-4">
        {rows.map((r) => (
          <ReminderRow key={r.id} row={r} sent={sent.has(r.id)} onSend={() => onSend(r.id)} />
        ))}
      </div>
    </section>
  );
}

export default function RemindersClient({ overdue, urgent, upcoming, isGeneralAdmin }: Props) {
  const [sent, setSent] = useState<Set<string>>(new Set());
  const mark = (id: string) => setSent((s) => new Set(s).add(id));

  const total = overdue.length + urgent.length + upcoming.length;

  if (total === 0) {
    return (
      <div className="card p-12 text-center">
        <Building2 size={40} className="text-dark/20 dark:text-cream/20 mx-auto mb-3" />
        <p className="text-dark/50 dark:text-cream/50">אין מתחמים הדורשים תזכורת כרגע</p>
        <p className="text-xs text-dark/30 dark:text-cream/30 mt-1">כל המתחמים בסטטוס תקין</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {sent.size > 0 && (
        <div className="card p-3 bg-emerald-500/5 border-emerald-500/20 text-sm text-emerald-600 dark:text-emerald-400 text-center">
          נשלחו {sent.size} תזכורות בסשן זה
        </div>
      )}
      <Section title="חריגות יעד" rows={overdue} color="text-red-500" sent={sent} onSend={mark} isGeneralAdmin={isGeneralAdmin} />
      <Section title="שבוע אחרון" rows={urgent} color="text-amber-500" sent={sent} onSend={mark} isGeneralAdmin={isGeneralAdmin} />
      <Section title="שבועיים הקרובים" rows={upcoming} color="text-dark/50 dark:text-cream/50" sent={sent} onSend={mark} isGeneralAdmin={isGeneralAdmin} />
    </div>
  );
}
