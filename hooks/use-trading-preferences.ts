"use client"

import { useCallback, useEffect, useState } from "react"

const STORAGE_KEY = "trade-terminal:trading-preferences"
const DEFAULT_BALANCE = 1000

interface TradingPreferences {
  availableBalanceUsdt: number
}

function readPreferences(): TradingPreferences {
  if (typeof window === "undefined") {
    return { availableBalanceUsdt: DEFAULT_BALANCE }
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { availableBalanceUsdt: DEFAULT_BALANCE }
    const parsed = JSON.parse(raw) as Partial<TradingPreferences>
    const balance = Number(parsed.availableBalanceUsdt)
    return {
      availableBalanceUsdt:
        Number.isFinite(balance) && balance > 0 ? balance : DEFAULT_BALANCE,
    }
  } catch {
    return { availableBalanceUsdt: DEFAULT_BALANCE }
  }
}

export function useTradingPreferences() {
  const [preferences, setPreferences] = useState<TradingPreferences>(readPreferences)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setPreferences(readPreferences())
    setHydrated(true)
  }, [])

  const setAvailableBalanceUsdt = useCallback((value: number) => {
    setPreferences((prev) => {
      const next = { ...prev, availableBalanceUsdt: value }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  return {
    availableBalanceUsdt: preferences.availableBalanceUsdt,
    setAvailableBalanceUsdt,
    hydrated,
  }
}
