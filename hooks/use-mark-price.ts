"use client"

import { useEffect, useState } from "react"

import { subscribeMarkPriceStream } from "@/lib/market/mark-price-stream"
import { toBinanceSymbol } from "@/lib/market/symbols"

interface UseMarkPriceResult {
  markPrice: number | null
  isLive: boolean
}

export function useMarkPrice(pair: string, enabled = true): UseMarkPriceResult {
  const [markPrice, setMarkPrice] = useState<number | null>(null)
  const [isLive, setIsLive] = useState(false)

  useEffect(() => {
    if (!enabled || !pair) {
      setMarkPrice(null)
      setIsLive(false)
      return
    }

    const symbol = toBinanceSymbol(pair)
    let disposed = false
    let pollTimer: ReturnType<typeof setInterval> | null = null

    async function pollMarkPrice() {
      try {
        const params = new URLSearchParams({ symbol, limit: "1" })
        const response = await fetch(`/api/market/klines?${params}`)
        if (!response.ok || disposed) return
        const body = (await response.json()) as { lastPrice: number | null }
        if (body.lastPrice !== null && !disposed) {
          setMarkPrice(body.lastPrice)
        }
      } catch {
        // keep last known price
      }
    }

    void pollMarkPrice()
    pollTimer = setInterval(pollMarkPrice, 5000)

    const unsubscribe = subscribeMarkPriceStream(
      symbol,
      (price) => {
        if (!disposed) setMarkPrice(price)
      },
      (connected) => {
        if (!disposed) setIsLive(connected)
      },
    )

    return () => {
      disposed = true
      if (pollTimer) clearInterval(pollTimer)
      unsubscribe()
      setIsLive(false)
    }
  }, [pair, enabled])

  return { markPrice, isLive }
}
