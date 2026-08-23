import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { differenceInDays, format, formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string) {
  return format(new Date(date), "dd/MM/yyyy", { locale: he });
}

export function formatRelative(date: Date | string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: he });
}

export function daysRemaining(deadlineAt: Date | string): number {
  return differenceInDays(new Date(deadlineAt), new Date());
}

export function deadlineColor(days: number): string {
  if (days < 0) return "text-red-600 dark:text-red-400";
  if (days <= 3) return "text-orange-500 dark:text-orange-400";
  if (days <= 7) return "text-amber-500 dark:text-amber-400";
  return "text-emerald-600 dark:text-emerald-400";
}

export function buildWhatsappUrl(phone: string, message: string): string {
  const clean = phone.replace(/\D/g, "").replace(/^0/, "972");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

export function assignmentWhatsappMessage(
  areaManagerName: string,
  complexName: string,
  city: string,
  deadlineDays: number,
  domainManagerName: string
): string {
  return `שלום ${areaManagerName},\n\nהוקצה לך מתחם חדש לטיפול:\n📍 *${complexName}* — ${city}\n⏱ יעד: ${deadlineDays} ימים\n\nבהצלחה!\n${domainManagerName}`;
}

export function reminderWhatsappMessage(
  areaManagerName: string,
  complexName: string,
  city: string,
  daysLeft: number
): string {
  return `שלום ${areaManagerName},\n\n⚠️ תזכורת: נותרו *${daysLeft} ימים* לטיפול במתחם:\n📍 *${complexName}* — ${city}\n\nאנא עדכן את הסטטוס במערכת.`;
}
