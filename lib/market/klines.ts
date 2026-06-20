import type { ChartInterval, MarketCandle } from "@/lib/market/types"

const BINANCE_FAPI = "https://fapi.binance.com"

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
