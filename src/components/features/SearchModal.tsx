"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Building2, Users, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { ROLE_LABELS } from "@/types";
import { cn } from "@/lib/utils";

interface Result {
  complexes: Array<{ id: string; name: string; city: string; address: string; domain: { name: string } | null }>;
  users: Array<{ id: string; fullName: string; role: string; domain: { name: string } | null }>;
}

export default function SearchModal() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result>({ complexes: [], users: [] });
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setOpen(true); }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else { setQ(""); setResults({ complexes: [], users: [] }); }
  }, [open]);

  useEffect(() => {
    clearTimeout(debounce.current);
    if (q.length < 2) { setResults({ complexes: [], users: [] }); return; }
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        setResults(await res.json());
        setCursor(0);
      } finally { setLoading(false); }
    }, 250);
  }, [q]);

  const allItems = [
    ...results.complexes.map(c => ({ type: "complex" as const, id: c.id, label: c.name, sub: `${c.city} · ${c.domain?.name ?? ""}`, href: `/complexes/${c.id}` })),
    ...results.users.map(u => ({ type: "user" as const, id: u.id, label: u.fullName, sub: `${ROLE_LABELS[u.role as keyof typeof ROLE_LABELS] ?? u.role} · ${u.domain?.name ?? ""}`, href: `/users` })),
  ];

  function navigate(href: string) { router.push(href); setOpen(false); }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor(c => Math.min(c + 1, allItems.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
    if (e.key === "Enter" && allItems[cursor]) navigate(allItems[cursor].href);
  }

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      className="hidden md:flex fixed top-3 left-1/2 -translate-x-1/2 z-30 items-center gap-2 px-3 py-1.5 rounded-lg border border-line bg-white/5 dark:bg-dark-soft/50 text-dark/40 dark:text-cream/40 text-xs hover:border-gold/30 hover:text-dark/70 dark:hover:text-cream/60 transition-colors shadow-sm"
    >
      <Search size={13} /> חיפוש <kbd className="bg-dark/5 dark:bg-cream/10 rounded px-1 text-[10px]">⌘K</kbd>
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="card overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-line">
            <Search size={18} className="text-dark/40 dark:text-cream/40 flex-shrink-0" />
            <input
              ref={inputRef}
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="חיפוש מתחם, עיר, משתמש..."
              className="flex-1 bg-transparent outline-none text-sm text-dark dark:text-cream placeholder:text-dark/40 dark:placeholder:text-cream/40"
            />
            {loading && <div className="w-4 h-4 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />}
            <button onClick={() => setOpen(false)} className="text-dark/30 dark:text-cream/30 hover:text-dark dark:hover:text-cream">
              <X size={16} />
            </button>
          </div>

          {allItems.length > 0 && (
            <div className="py-2 max-h-80 overflow-y-auto">
              {results.complexes.length > 0 && (
                <>
                  <p className="px-4 py-1 text-[11px] font-semibold text-dark/30 dark:text-cream/30 uppercase tracking-wider">מתחמים</p>
                  {results.complexes.map((c, i) => (
                    <button key={c.id} onClick={() => navigate(`/complexes/${c.id}`)}
                      className={cn("w-full flex items-center gap-3 px-4 py-2.5 text-right transition-colors", cursor === i ? "bg-gold/10" : "hover:bg-offwhite dark:hover:bg-dark-soft")}>
                      <Building2 size={15} className="text-gold flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-dark dark:text-cream truncate">{c.name}</p>
                        <p className="text-xs text-dark/40 dark:text-cream/40">{c.city} · {c.domain?.name}</p>
                      </div>
                    </button>
                  ))}
                </>
              )}
              {results.users.length > 0 && (
                <>
                  <p className="px-4 py-1 text-[11px] font-semibold text-dark/30 dark:text-cream/30 uppercase tracking-wider mt-1">משתמשים</p>
                  {results.users.map((u, i) => {
                    const idx = results.complexes.length + i;
                    return (
                      <button key={u.id} onClick={() => navigate("/users")}
                        className={cn("w-full flex items-center gap-3 px-4 py-2.5 text-right transition-colors", cursor === idx ? "bg-gold/10" : "hover:bg-offwhite dark:hover:bg-dark-soft")}>
                        <Users size={15} className="text-blue-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-dark dark:text-cream">{u.fullName}</p>
                          <p className="text-xs text-dark/40 dark:text-cream/40">{ROLE_LABELS[u.role as keyof typeof ROLE_LABELS]}</p>
                        </div>
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          )}

          {q.length >= 2 && !loading && allItems.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-dark/40 dark:text-cream/40">אין תוצאות עבור &quot;{q}&quot;</div>
          )}

          {q.length < 2 && (
            <div className="px-4 py-4 text-xs text-dark/30 dark:text-cream/30 text-center">הקלד לפחות 2 תווים לחיפוש</div>
          )}
        </div>
      </div>
    </div>
  );
}
