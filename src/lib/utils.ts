import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format thời gian thân thiện (UTC+7 Asia/Ho_Chi_Minh)
 */
export function formatDateTimeVN(isoDateString?: string | null): string {
  if (!isoDateString) return "Chưa có";
  try {
    const date = new Date(isoDateString);
    return new Intl.DateTimeFormat("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return isoDateString;
  }
}
