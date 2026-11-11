import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatUSPhoneNumber(input: string): string {
  const digits = input.replace(/\D/g, "");
  // Strip leading 1 if US country code is included
  const raw = digits.startsWith("1") && digits.length > 10 ? digits.slice(1) : digits;
  if (raw.length <= 3) return raw;
  if (raw.length <= 6) return `(${raw.slice(0, 3)}) ${raw.slice(3)}`;
  return `(${raw.slice(0, 3)}) ${raw.slice(3, 6)}-${raw.slice(6, 10)}`;
}
