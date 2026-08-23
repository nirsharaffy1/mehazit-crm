"use client";
import { useState } from "react";
import { Circle } from "lucide-react";
import { ROLE_LABELS } from "@/types";
import WeeklyTargetCell from "@/components/features/WeeklyTargetCell";
import EditUserModal from "@/components/features/EditUserModal";
import { formatRelative } from "@/lib/utils";

interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  domainId: string | null;
  isActive: boolean;
  weeklyVisitTarget: number;
  lastLoginAt: Date | null;
  domain: { id: string; name: string } | null;
}

interface Domain {
  id: string;
  name: string;
}

interface Props {
  initialUsers: User[];
  domains: Domain[];
  visitsByUser: Record<string, number>;
}

export default function UsersTableClient({ initialUsers, domains, visitsByUser }: Props) {
  const [users, setUsers] = useState(initialUsers);

  function handleSaved(updated: User) {
    setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, ...updated } : u));
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-line">
            <tr className="text-right">
              <th className="px-4 py-3 text-xs font-medium text-dark/50 dark:text-cream/50">שם</th>
              <th className="px-4 py-3 text-xs font-medium text-dark/50 dark:text-cream/50 hidden md:table-cell">אימייל</th>
              <th className="px-4 py-3 text-xs font-medium text-dark/50 dark:text-cream/50">תפקיד</th>
              <th className="px-4 py-3 text-xs font-medium text-dark/50 dark:text-cream/50 hidden md:table-cell">תחום</th>
              <th className="px-4 py-3 text-xs font-medium text-dark/50 dark:text-cream/50 hidden lg:table-cell">יעד שבועי</th>
              <th className="px-4 py-3 text-xs font-medium text-dark/50 dark:text-cream/50 hidden lg:table-cell">כניסה אחרונה</th>
              <th className="px-4 py-3 text-xs font-medium text-dark/50 dark:text-cream/50">סטטוס</th>
              <th className="px-4 py-3 w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {users.map((u) => {
              const roleKey = u.role as keyof typeof ROLE_LABELS;
              return (
                <tr key={u.id} className="hover:bg-offwhite dark:hover:bg-dark-soft transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gold/15 flex items-center justify-center flex-shrink-0">
                        <span className="text-gold text-xs font-bold">{u.fullName.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-medium text-dark dark:text-cream">{u.fullName}</p>
                        {u.phone && <p className="text-xs text-dark/40 dark:text-cream/40 md:hidden">{u.phone}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-dark/60 dark:text-cream/60 hidden md:table-cell">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs ${u.role === "GENERAL_ADMIN" ? "badge-gold" : u.role === "DOMAIN_MANAGER" ? "badge-green" : "badge-gray"}`}>
                      {ROLE_LABELS[roleKey] ?? u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-dark/60 dark:text-cream/60 hidden md:table-cell">
                    {u.domain?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {u.role === "AREA_MANAGER" ? (
                      <WeeklyTargetCell
                        userId={u.id}
                        initialTarget={u.weeklyVisitTarget}
                        visitsThisWeek={visitsByUser[u.id] ?? 0}
                      />
                    ) : (
                      <span className="text-xs text-dark/20 dark:text-cream/20">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-dark/40 dark:text-cream/40 text-xs hidden lg:table-cell">
                    {u.lastLoginAt ? formatRelative(u.lastLoginAt) : "מעולם"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1.5 text-xs ${u.isActive ? "text-emerald-500" : "text-red-500"}`}>
                      <Circle size={8} fill="currentColor" />
                      {u.isActive ? "פעיל" : "מושבת"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <EditUserModal user={u} domains={domains} onSaved={handleSaved} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
