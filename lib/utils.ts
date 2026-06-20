import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatUsdt(value: number, digits = 2): string {
  const sign = value >= 0 ? "+" : ""
  return `${sign}${value.toFixed(digits)} USDT`
}

export function formatPct(value: number, digits = 2): string {
  const sign = value >= 0 ? "+" : ""
  return `${sign}${value.toFixed(digits)}%`
}

export function formatPrice(value: number): string {
  if (value >= 100) return value.toFixed(2)
  if (value >= 1) return value.toFixed(4)
  return value.toFixed(6)
}

export function formatRatio(value: number, digits = 1): string {
  return `${value.toFixed(digits)}:1`
}
