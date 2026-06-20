"use client"

import type { CandlestickData, UTCTimestamp } from "lightweight-charts"
import { useEffect, useRef, useState } from "react"

import { toBinanceSymbol } from "@/lib/market/symbols"
import type { ChartInterval, MarketCandle, MarketKlinesStatus } from "@/lib/market/types"

interface UseHistoricalKlinesOptions {
  enabled?: boolean
  startTimeMs: number
  endTimeMs: number
  interval?: ChartInterval
}

interface UseHistoricalKlinesResult {
  candles: CandlestickData<UTCTimestamp>[]
  status: MarketKlinesStatus
  lastPrice: number | null
  error: string | null
  scopeKey: string
}

function toChartCandles(candles: MarketCandle[]): CandlestickData<UTCTimestamp>[] {
  return candles.map((candle) => ({
    time: candle.time as UTCTimestamp,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
  }))
}

export function useHistoricalKlines(
  pair: string,
  options: UseHistoricalKlinesOptions,
): UseHistoricalKlinesResult {
  const { enabled = true, startTimeMs, endTimeMs, interval = "1m" } = options
  const [candles, setCandles] = useState<CandlestickData<UTCTimestamp>[]>([])
  const [status, setStatus] = useState<MarketKlinesStatus>("idle")
  const [lastPrice, setLastPrice] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadedScopeKey, setLoadedScopeKey] = useState("")

  const scopeKey = `${pair}|${startTimeMs}|${endTimeMs}|${interval}`
  const activeScopeRef = useRef(scopeKey)

  const isActive =
    enabled && Boolean(pair) && startTimeMs > 0 && endTimeMs > startTimeMs

  useEffect(() => {
    activeScopeRef.current = scopeKey
  }, [scopeKey])

  useEffect(() => {
    if (!isActive) return

    setCandles([])
    setLastPrice(null)
    setLoadedScopeKey("")
    setStatus("loading")
    setError(null)

    const symbol = toBinanceSymbol(pair)
    const controller = new AbortController()
    const requestScope = scopeKey

    async function loadHistoricalKlines() {
      try {
        const params = new URLSearchParams({
          symbol,
          interval,
          startTime: String(startTimeMs),
          endTime: String(endTimeMs),
        })

        const response = await fetch(`/api/market/klines?${params}`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as {
            error?: string
          } | null
          throw new Error(body?.error ?? `Klines request failed (${response.status})`)
        }

        const body = (await response.json()) as {
          candles: MarketCandle[]
          lastPrice: number | null
        }

        if (controller.signal.aborted || activeScopeRef.current !== requestScope) {
          return
        }

        const chartCandles = toChartCandles(body.candles)
        setCandles(chartCandles)
        setLastPrice(body.lastPrice)
        setLoadedScopeKey(requestScope)
        setStatus("ready")
      } catch (fetchError) {
        if (controller.signal.aborted || activeScopeRef.current !== requestScope) {
          return
        }
        const message =
          fetchError instanceof Error ? fetchError.message : "Failed to load klines"
        setError(message)
        setStatus("error")
      }
    }

    void loadHistoricalKlines()

    return () => {
      controller.abort()
    }
  }, [pair, isActive, startTimeMs, endTimeMs, interval, scopeKey])

  const scopeMatches = loadedScopeKey === scopeKey
  const safeCandles = scopeMatches ? candles : []

  if (!isActive) {
    return {
      candles: [],
      status: "idle",
      lastPrice: null,
      error: null,
      scopeKey,
    }
  }

  return {
    candles: safeCandles,
    status: scopeMatches ? status : "loading",
    lastPrice: scopeMatches ? lastPrice : null,
    error: scopeMatches ? error : null,
    scopeKey,
  }
}
