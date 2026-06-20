import type { ChartInterval, KlineStreamStatus, MarketCandle } from "@/lib/market/types"

const WS_BASE = "wss://fstream.binance.com/ws"
const MAX_BACKOFF_MS = 30_000

interface BinanceKlineMessage {
  e: string
  k: {
    t: number
    o: string
    h: string
    l: string
    c: string
  }
}

export interface KlineStreamCallbacks {
  onCandle: (candle: MarketCandle) => void
  onStatus: (status: KlineStreamStatus) => void
}

export function subscribeKlineStream(
  symbol: string,
  interval: ChartInterval,
  callbacks: KlineStreamCallbacks,
): () => void {
  const streamSymbol = symbol.toLowerCase()
  let ws: WebSocket | null = null
  let disposed = false
  let reconnectAttempt = 0
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let connectTimer: ReturnType<typeof setTimeout> | null = null
  let paused = false

  function closeSocket() {
    if (!ws) return
    ws.onopen = null
    ws.onmessage = null
    ws.onerror = null
    ws.onclose = null
    if (
      ws.readyState === WebSocket.CONNECTING ||
      ws.readyState === WebSocket.OPEN
    ) {
      ws.close()
    }
    ws = null
  }

  function clearReconnectTimer() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
  }

  function scheduleReconnect() {
    if (disposed || paused) return
    clearReconnectTimer()
    const delay = Math.min(1000 * 2 ** reconnectAttempt, MAX_BACKOFF_MS)
    reconnectAttempt += 1
    reconnectTimer = setTimeout(connect, delay)
  }

  function connect() {
    if (disposed || paused) return

    callbacks.onStatus("connecting")
    ws = new WebSocket(`${WS_BASE}/${streamSymbol}@kline_${interval}`)

    ws.onopen = () => {
      reconnectAttempt = 0
      callbacks.onStatus("connected")
    }

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data as string) as BinanceKlineMessage
        if (payload.e !== "kline" || !payload.k) return

        callbacks.onCandle({
          time: Math.floor(payload.k.t / 1000),
          open: Number(payload.k.o),
          high: Number(payload.k.h),
          low: Number(payload.k.l),
          close: Number(payload.k.c),
        })
      } catch {
        // ignore malformed frames
      }
    }

    ws.onerror = () => {
      callbacks.onStatus("disconnected")
    }

    ws.onclose = () => {
      ws = null
      callbacks.onStatus("disconnected")
      scheduleReconnect()
    }
  }

  function handleVisibilityChange() {
    if (document.visibilityState === "hidden") {
      paused = true
      clearReconnectTimer()
      closeSocket()
      callbacks.onStatus("paused")
      return
    }

    paused = false
    reconnectAttempt = 0
    connectTimer = setTimeout(connect, 0)
  }

  document.addEventListener("visibilitychange", handleVisibilityChange)
  connectTimer = setTimeout(connect, 0)

  return () => {
    disposed = true
    paused = true
    clearReconnectTimer()
    if (connectTimer) {
      clearTimeout(connectTimer)
      connectTimer = null
    }
    document.removeEventListener("visibilitychange", handleVisibilityChange)
    closeSocket()
    callbacks.onStatus("disconnected")
  }
}
