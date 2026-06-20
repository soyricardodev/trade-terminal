const WS_BASE = "wss://fstream.binance.com/ws"
const MAX_BACKOFF_MS = 30_000

interface BinanceMarkPriceMessage {
  e: string
  p: string
}

export function subscribeMarkPriceStream(
  symbol: string,
  onPrice: (price: number) => void,
  onStatus: (connected: boolean) => void,
): () => void {
  const streamSymbol = symbol.toLowerCase()
  let ws: WebSocket | null = null
  let disposed = false
  let reconnectAttempt = 0
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let connectTimer: ReturnType<typeof setTimeout> | null = null

  function clearReconnectTimer() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
  }

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

  function scheduleReconnect() {
    if (disposed) return
    clearReconnectTimer()
    const delay = Math.min(1000 * 2 ** reconnectAttempt, MAX_BACKOFF_MS)
    reconnectAttempt += 1
    reconnectTimer = setTimeout(connect, delay)
  }

  function connect() {
    if (disposed) return

    onStatus(false)
    ws = new WebSocket(`${WS_BASE}/${streamSymbol}@markPrice@1s`)

    ws.onopen = () => {
      reconnectAttempt = 0
      onStatus(true)
    }

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data as string) as BinanceMarkPriceMessage
        if (payload.e !== "markPriceUpdate") return
        const price = Number(payload.p)
        if (Number.isFinite(price)) onPrice(price)
      } catch {
        // ignore malformed frames
      }
    }

    ws.onerror = () => {
      onStatus(false)
    }

    ws.onclose = () => {
      ws = null
      onStatus(false)
      scheduleReconnect()
    }
  }

  connectTimer = setTimeout(connect, 0)

  return () => {
    disposed = true
    clearReconnectTimer()
    if (connectTimer) {
      clearTimeout(connectTimer)
      connectTimer = null
    }
    closeSocket()
    onStatus(false)
  }
}
