"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { nanoid } from "nanoid"

import type {
  JournalEntry,
  JournalStats,
  RiskAnalysis,
  TradeSetup,
} from "@/lib/signal-risk/types"
import {
  addJournalEntry,
  closeJournalEntry,
  computeJournalStats,
  exportJournalJson,
  importJournalJson,
  readJournalEntries,
  removeJournalEntry,
  writeJournalEntries,
} from "@/lib/trade-journal/storage"

interface SaveTradeInput {
  setup: TradeSetup
  analysis: RiskAnalysis
  source: JournalEntry["source"]
  rawSignal?: string
  actualEntry?: number
}

export function useTradeJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [hydrated, setHydrated] = useState(false)

  const refresh = useCallback(() => {
    setEntries(readJournalEntries())
  }, [])

  useEffect(() => {
    refresh()
    setHydrated(true)

    function onStorage(event: StorageEvent) {
      if (event.key === null || event.key.includes("signal-risk-suite:journal")) {
        refresh()
      }
    }

    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [refresh])

  const stats: JournalStats = useMemo(
    () => computeJournalStats(entries),
    [entries],
  )

  const saveTrade = useCallback(
    (input: SaveTradeInput) => {
      const entry: JournalEntry = {
        id: nanoid(),
        createdAt: new Date().toISOString(),
        status: "open",
        setup: input.setup,
        analysis: input.analysis,
        source: input.source,
        rawSignal: input.rawSignal,
        actualEntry: input.actualEntry ?? input.setup.entry,
      }
      const next = addJournalEntry(entry)
      setEntries(next)
      return entry
    },
    [],
  )

  const closeTrade = useCallback(
    (id: string, actualExit: number, notes?: string) => {
      const closed = closeJournalEntry(id, actualExit, notes)
      refresh()
      return closed
    },
    [refresh],
  )

  const deleteTrade = useCallback(
    (id: string) => {
      const next = removeJournalEntry(id)
      setEntries(next)
    },
    [],
  )

  const exportJson = useCallback(() => exportJournalJson(entries), [entries])

  const importJson = useCallback((raw: string) => {
    const next = importJournalJson(raw)
    setEntries(next)
    return next
  }, [])

  const clearAll = useCallback(() => {
    writeJournalEntries([])
    setEntries([])
  }, [])

  return {
    entries,
    stats,
    hydrated,
    saveTrade,
    closeTrade,
    deleteTrade,
    exportJson,
    importJson,
    clearAll,
    refresh,
  }
}
