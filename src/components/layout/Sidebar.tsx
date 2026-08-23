"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, Building2, Users, MapPin, BarChart3,
  Activity, LogOut, ChevronLeft, Menu, X, Sun, Moon, Link2, Bell, Map, CalendarDays, KeyRound
} from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { CrmRole, ROLE_LABELS } from "@/types";
import ChangePasswordModal from "@/components/features/ChangePasswordModal";

interface SidebarProps {
  userRole: CrmRole;
  userName: string;
}

const navItems = [
  { href: "/dashboard", label: "לוח בקרה", icon: LayoutDashboard, roles: ["GENERAL_ADMIN", "DOMAIN_MANAGER", "AREA_MANAGER"] },
  { href: "/complexes", label: "מתחמים", icon: Building2, roles: ["GENERAL_ADMIN", "DOMAIN_MANAGER", "AREA_MANAGER"] },
  { href: "/users", label: "ניהול משתמשים", icon: Users, roles: ["GENERAL_ADMIN"] },
  { href: "/regions", label: "ניהול תחומים", icon: MapPin, roles: ["GENERAL_ADMIN"] },
  { href: "/map", label: "מפה", icon: Map, roles: ["GENERAL_ADMIN", "DOMAIN_MANAGER"] },
  { href: "/calendar", label: "לוח שנה", icon: CalendarDays, roles: ["GENERAL_ADMIN", "DOMAIN_MANAGER", "AREA_MANAGER"] },
  { href: "/reports", label: "דוחות", icon: BarChart3, roles: ["GENERAL_ADMIN", "DOMAIN_MANAGER"] },
  { href: "/reminders", label: "תזכורות", icon: Bell, roles: ["GENERAL_ADMIN", "DOMAIN_MANAGER"], badge: true },
  { href: "/activity", label: "יומן פעילות", icon: Activity, roles: ["GENERAL_ADMIN"] },
  { href: "/login-links", label: "קישורי כניסה", icon: Link2, roles: ["GENERAL_ADMIN"] },
] as const;

export default function Sidebar({ userRole, userName }: SidebarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [reminderBadge, setReminderBadge] = useState(0);
  const [showChangePassword, setShowChangePassword] = useState(false);

  useEffect(() => {
    if (userRole === "AREA_MANAGER") return;
    fetch("/api/badges")
      .then((r) => r.json())
      .then((d) => setReminderBadge(d.reminders ?? 0))
      .catch(() => {});
  }, [userRole]);

  const allowed = navItems.filter((item) =>
    (item.roles as readonly string[]).includes(userRole)
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-4 border-b border-white/10">
        <img src="/logo-transparent.png" alt="מהחזית אל הבית" className="h-12 w-auto object-contain" />
        <p className="text-cream/40 text-xs mt-1">ניהול פנימי</p>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {allowed.map(({ href, label, icon: Icon, ...rest }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          const hasBadge = "badge" in rest && rest.badge && reminderBadge > 0;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn("sidebar-item", active ? "sidebar-item-active" : "sidebar-item-inactive")}
            >
              <Icon size={18} className="flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {hasBadge && (
                <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {reminderBadge > 99 ? "99+" : reminderBadge}
                </span>
              )}
              {active && !hasBadge && <ChevronLeft size={14} className="mr-auto opacity-60" />}
            </Link>
          );
        })}
      </nav>

      <div className="px-2 pb-4 border-t border-white/10 pt-3 space-y-1">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="sidebar-item sidebar-item-inactive w-full"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          <span>{theme === "dark" ? "מצב בהיר" : "מצב כהה"}</span>
        </button>

        <div className="px-3 py-2.5 rounded-lg bg-white/5 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-cream text-sm font-medium truncate">{userName}</p>
            <p className="text-cream/40 text-xs">{ROLE_LABELS[userRole]}</p>
          </div>
          <button
            onClick={() => setShowChangePassword(true)}
            className="text-cream/40 hover:text-gold flex-shrink-0"
            title="שינוי סיסמה"
          >
            <KeyRound size={15} />
          </button>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="sidebar-item sidebar-item-inactive w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <LogOut size={18} />
          <span>יציאה</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} />}
      <aside className="hidden md:flex flex-col w-56 flex-shrink-0 bg-dark-sidebar border-l border-white/10 h-screen sticky top-0">
        <SidebarContent />
      </aside>

      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-dark-sidebar border-b border-white/10 fixed top-0 inset-x-0 z-40">
        <p className="font-display text-gold font-semibold text-sm">מהחזית אל הבית</p>
        <button onClick={() => setOpen(!open)} className="text-cream/60 hover:text-cream">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setOpen(false)} />
          <aside className="fixed top-0 right-0 h-full w-64 bg-dark-sidebar z-50 md:hidden flex flex-col">
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
}
