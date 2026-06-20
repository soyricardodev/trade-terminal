import type { JournalEntry, JournalStats } from "@/lib/signal-risk/types"
import {
  calculateActualPnlUsdt,
  resolveJournalStatus,
} from "@/lib/signal-risk/calculator"

export const JOURNAL_STORAGE_KEY = "signal-risk-suite:journal:v1"

export function readJournalEntries(): JournalEntry[] {
  if (typeof window === "undefined") return []

  try {
    const raw = window.localStorage.getItem(JOURNAL_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as JournalEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeJournalEntries(entries: JournalEntry[]): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(entries))
}

export function addJournalEntry(entry: JournalEntry): JournalEntry[] {
  const entries = [entry, ...readJournalEntries()]
  writeJournalEntries(entries)
  return entries
}

export function updateJournalEntry(
  id: string,
  updater: (entry: JournalEntry) => JournalEntry,
): JournalEntry[] {
  const entries = readJournalEntries().map((entry) =>
    entry.id === id ? updater(entry) : entry,
  )
  writeJournalEntries(entries)
  return entries
}

export function removeJournalEntry(id: string): JournalEntry[] {
  const entries = readJournalEntries().filter((entry) => entry.id !== id)
  writeJournalEntries(entries)
  return entries
}

export function closeJournalEntry(
  id: string,
  actualExit: number,
  notes?: string,
): JournalEntry | null {
  let closed: JournalEntry | null = null

  const entries = updateJournalEntry(id, (entry) => {
    if (entry.status !== "open") return entry

    const pnlUsdt = calculateActualPnlUsdt(
      entry.setup,
      entry.actualEntry,
      actualExit,
    )
    const status = resolveJournalStatus(pnlUsdt)

    closed = {
      ...entry,
      actualExit,
      pnlUsdt,
      status,
      closedAt: new Date().toISOString(),
      notes: notes?.trim() || entry.notes,
    }
    return closed
  })

  void entries
  return closed
}

export function computeJournalStats(entries: JournalEntry[]): JournalStats {
  const closed = entries.filter((entry) => entry.status !== "open")
  const wins = closed.filter((entry) => entry.status === "win").length
  const losses = closed.filter((entry) => entry.status === "loss").length
  const breakevens = closed.filter((entry) => entry.status === "breakeven").length
  const openTrades = entries.filter((entry) => entry.status === "open").length
  const totalPnlUsdt = closed.reduce(
    (sum, entry) => sum + (entry.pnlUsdt ?? 0),
    0,
  )

  return {
    totalTrades: entries.length,
    openTrades,
    closedTrades: closed.length,
    wins,
    losses,
    breakevens,
    winRate: closed.length > 0 ? (wins / closed.length) * 100 : 0,
    totalPnlUsdt,
  }
}

export function exportJournalJson(entries: JournalEntry[]): string {
  return JSON.stringify(entries, null, 2)
}

export function importJournalJson(raw: string): JournalEntry[] {
  const parsed = JSON.parse(raw) as JournalEntry[]
  if (!Array.isArray(parsed)) {
    throw new Error("Invalid journal export format")
  }
  writeJournalEntries(parsed)
  return parsed
}
