import type { ChartInterval, KlineInterval, MarketCandle } from "@/lib/market/types"

const BINANCE_FAPI = "https://fapi.binance.com"
const MAX_KLINES_PER_REQUEST = 1500

type BinanceKlineRow = [
  number,
  string,
  string,
  string,
  string,
  string,
  number,
  string,
  number,
  string,
  string,
  string,
]

export function mapBinanceKlines(rows: BinanceKlineRow[]): MarketCandle[] {
  return rows.map((row) => ({
    time: Math.floor(row[0] / 1000),
    open: Number(row[1]),
    high: Number(row[2]),
    low: Number(row[3]),
    close: Number(row[4]),
  }))
}

export async function fetchBinanceKlines(
  symbol: string,
  interval: ChartInterval,
  limit = 200,
): Promise<MarketCandle[]> {
  const url = new URL(`${BINANCE_FAPI}/fapi/v1/klines`)
  url.searchParams.set("symbol", symbol)
  url.searchParams.set("interval", interval)
  url.searchParams.set("limit", String(limit))

  const response = await fetch(url, { next: { revalidate: 60 } })
  if (!response.ok) {
    throw new Error(`Binance klines failed: ${response.status}`)
  }

  const data = (await response.json()) as BinanceKlineRow[]
  return mapBinanceKlines(data)
}

export interface FetchKlinesRangeOptions {
  throttleMs?: number
  onRequest?: () => Promise<void> | void
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchBinanceKlinesPage(
  symbol: string,
  interval: KlineInterval,
  startTime: number,
  endTime: number,
  limit: number,
): Promise<MarketCandle[]> {
  const url = new URL(`${BINANCE_FAPI}/fapi/v1/klines`)
  url.searchParams.set("symbol", symbol)
  url.searchParams.set("interval", interval)
  url.searchParams.set("startTime", String(startTime))
  url.searchParams.set("endTime", String(endTime))
  url.searchParams.set("limit", String(limit))

  const response = await fetch(url)
  if (response.status === 429) {
    throw new Error("Binance klines rate limited (429)")
  }
  if (!response.ok) {
    throw new Error(`Binance klines failed: ${response.status}`)
  }

  const data = (await response.json()) as BinanceKlineRow[]
  return mapBinanceKlines(data)
}

export async function fetchBinanceKlinesRange(
  symbol: string,
  interval: KlineInterval,
  startTime: number,
  endTime: number,
  options: FetchKlinesRangeOptions = {},
): Promise<MarketCandle[]> {
  const throttleMs = options.throttleMs ?? 0
  const candles: MarketCandle[] = []
  let cursor = startTime

  while (cursor < endTime) {
    if (options.onRequest) {
      await options.onRequest()
    } else if (throttleMs > 0 && candles.length > 0) {
      await sleep(throttleMs)
    }

    const batch = await fetchBinanceKlinesPage(
      symbol,
      interval,
      cursor,
      endTime,
      MAX_KLINES_PER_REQUEST,
    )

    if (batch.length === 0) break

    candles.push(...batch)

    const lastOpenMs = batch[batch.length - 1]!.time * 1000
    const nextCursor = lastOpenMs + 1
    if (nextCursor <= cursor) break
    cursor = nextCursor

    if (batch.length < MAX_KLINES_PER_REQUEST) break
  }

  return candles.filter(
    (candle) => candle.time * 1000 >= startTime && candle.time * 1000 <= endTime,
  )
}
