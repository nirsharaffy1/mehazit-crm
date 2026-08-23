import type { CrmRole, EngagementLevel, CrmProjectPhase } from "@prisma/client";

export type { CrmRole, EngagementLevel, CrmProjectPhase };

export const ROLE_LABELS: Record<CrmRole, string> = {
  GENERAL_ADMIN: "מנהל כללי",
  DOMAIN_MANAGER: "מנהל תחום",
  AREA_MANAGER: "מנהל איזור",
};

export const ENGAGEMENT_LABELS: Record<EngagementLevel, string> = {
  HIGH: "גבוהה",
  MEDIUM: "בינונית",
  LOW: "נמוכה",
  NO_CONTACT: "לא היה קשר",
};

export const ENGAGEMENT_COLORS: Record<EngagementLevel, string> = {
  HIGH: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  MEDIUM: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  LOW: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  NO_CONTACT: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

export const PHASE_LABELS: Record<CrmProjectPhase, string> = {
  INITIAL_CONTACT: "גישוש ראשוני",
  SURVEY: "סקר דיירים",
  AGREEMENTS: "השגת הסכמות",
  URBAN_PLAN: "תב\"ע / תכנון",
  PERMITS: "היתרים",
  CONSTRUCTION: "בנייה",
};

export const PHASES: CrmProjectPhase[] = [
  "INITIAL_CONTACT",
  "SURVEY",
  "AGREEMENTS",
  "URBAN_PLAN",
  "PERMITS",
  "CONSTRUCTION",
];

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: CrmRole;
      domainId: string | null;
    };
  }
}
