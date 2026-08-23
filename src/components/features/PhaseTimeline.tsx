"use client";
import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CrmProjectPhase, PHASE_LABELS, PHASES } from "@/types";

interface Props {
  complexId: string;
  initialPhase: CrmProjectPhase;
  canEdit: boolean;
}

export default function PhaseTimeline({ complexId, initialPhase, canEdit }: Props) {
  const [phase, setPhase] = useState<CrmProjectPhase>(initialPhase);
  const [saving, setSaving] = useState(false);

  const currentIndex = PHASES.indexOf(phase);

  async function updatePhase(newPhase: CrmProjectPhase) {
    if (!canEdit || saving || newPhase === phase) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/complexes/${complexId}/phase`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase: newPhase }),
      });
      if (res.ok) setPhase(newPhase);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative">
      {/* Connector line */}
      <div className="absolute top-4 right-4 left-4 h-0.5 bg-dark/10 dark:bg-cream/10 hidden md:block" />

      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 relative">
        {PHASES.map((p, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          return (
            <button
              key={p}
              onClick={() => updatePhase(p)}
              disabled={!canEdit || saving}
              className={cn(
                "flex flex-col items-center gap-2 p-2 rounded-lg transition-all text-center group",
                canEdit && !saving && "hover:bg-gold/10 cursor-pointer",
                !canEdit && "cursor-default"
              )}
            >
              {/* Circle */}
              <div className={cn(
                "w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all z-10 bg-offwhite dark:bg-dark-soft",
                done && "bg-gold border-gold",
                active && "border-gold scale-110 shadow-sm shadow-gold/30",
                !done && !active && "border-dark/20 dark:border-cream/20"
              )}>
                {saving && active
                  ? <Loader2 size={14} className="animate-spin text-gold" />
                  : done
                    ? <Check size={14} className="text-white" />
                    : <span className={cn(
                        "text-xs font-bold",
                        active ? "text-gold" : "text-dark/30 dark:text-cream/30"
                      )}>{i + 1}</span>
                }
              </div>
              {/* Label */}
              <span className={cn(
                "text-[11px] leading-tight font-medium transition-colors",
                done && "text-gold",
                active && "text-gold font-semibold",
                !done && !active && "text-dark/40 dark:text-cream/40"
              )}>
                {PHASE_LABELS[p]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
