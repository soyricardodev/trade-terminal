"use client"

import type { CandlestickData, UTCTimestamp } from "lightweight-charts"
import { useCallback, useEffect, useRef, useState } from "react"

import { subscribeKlineStream } from "@/lib/market/kline-stream"
import { toBinanceSymbol } from "@/lib/market/symbols"
import type {
  ChartInterval,
  MarketCandle,
  MarketKlinesStatus,
} from "@/lib/market/types"

interface UseMarketKlinesOptions {
  enabled?: boolean
}

interface UseMarketKlinesResult {
  candles: CandlestickData<UTCTimestamp>[]
  status: MarketKlinesStatus
  lastPrice: number | null
  isLive: boolean
  error: string | null
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

export function useMarketKlines(
  pair: string,
  interval: ChartInterval,
  options: UseMarketKlinesOptions = {},
): UseMarketKlinesResult {
  const { enabled = true } = options
  const [candles, setCandles] = useState<CandlestickData<UTCTimestamp>[]>([])
  const [status, setStatus] = useState<MarketKlinesStatus>("idle")
  const [lastPrice, setLastPrice] = useState<number | null>(null)
  const [isLive, setIsLive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const candlesRef = useRef<CandlestickData<UTCTimestamp>[]>([])

  const applyCandles = useCallback((next: CandlestickData<UTCTimestamp>[]) => {
    candlesRef.current = next
    setCandles(next)
    const last = next.at(-1)
    if (last && "close" in last) {
      setLastPrice(last.close)
    }
  }, [])

  useEffect(() => {
    if (!enabled || !pair) {
      setStatus("idle")
      setIsLive(false)
      return
    }

    const symbol = toBinanceSymbol(pair)
    let disposed = false
    const controller = new AbortController()

    candlesRef.current = []
    setCandles([])
    setLastPrice(null)

    async function bootstrap() {
      setStatus("loading")
      setError(null)
      setIsLive(false)

      try {
        const params = new URLSearchParams({
          symbol,
          interval,
          limit: "200",
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

        if (disposed) return

        const chartCandles = toChartCandles(body.candles)
        applyCandles(chartCandles)
        setLastPrice(body.lastPrice)
        setStatus("ready")
      } catch (fetchError) {
        if (disposed || controller.signal.aborted) return
        const message =
          fetchError instanceof Error ? fetchError.message : "Failed to load klines"
        setError(message)
        setStatus("error")
      }
    }

    void bootstrap()

    let pollTimer: ReturnType<typeof setInterval> | null = null

    pollTimer = setInterval(() => {
      if (disposed) return
      void (async () => {
        try {
          const params = new URLSearchParams({
            symbol,
            interval,
            limit: "2",
          })
          const response = await fetch(`/api/market/klines?${params}`)
          if (!response.ok || disposed) return
          const body = (await response.json()) as {
            candles: MarketCandle[]
            lastPrice: number | null
          }
          if (body.candles.length === 0 || disposed) return

          const chartCandles = toChartCandles(body.candles)
          const current = candlesRef.current
          const lastFetched = chartCandles.at(-1)
          const lastCurrent = current.at(-1)

          if (
            current.length === 0 ||
            !lastCurrent ||
            !lastFetched ||
            lastFetched.time !== lastCurrent.time
          ) {
            return
          }

          const next = [...current]
          next[next.length - 1] = lastFetched
          applyCandles(next)
          if (body.lastPrice !== null) setLastPrice(body.lastPrice)
        } catch {
          // polling is best-effort
        }
      })()
    }, 5000)

    const unsubscribe = subscribeKlineStream(symbol, interval, {
      onStatus: (streamStatus) => {
        if (disposed) return
        setIsLive(streamStatus === "connected")
        if (streamStatus === "connected" && candlesRef.current.length > 0) {
          setStatus("streaming")
        }
      },
      onCandle: (candle) => {
        if (disposed) return
        const next = [...candlesRef.current]
        const time = candle.time as UTCTimestamp
        const last = next.at(-1)

        if (last && last.time === time) {
          next[next.length - 1] = {
            time,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
          }
        } else if (!last || (typeof last.time === "number" && last.time < time)) {
          next.push({
            time,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
          })
        }

        applyCandles(next)
        setLastPrice(candle.close)
        setStatus("streaming")
      },
    })

    return () => {
      disposed = true
      controller.abort()
      if (pollTimer) clearInterval(pollTimer)
      unsubscribe()
      setIsLive(false)
    }
  }, [pair, interval, enabled, applyCandles])

  return { candles, status, lastPrice, isLive, error }
}
