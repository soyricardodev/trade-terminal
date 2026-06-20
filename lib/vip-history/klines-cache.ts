import { mkdir, readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"

import { fetchBinanceKlinesRange } from "@/lib/market/klines"
import type { MarketCandle } from "@/lib/market/types"
import { toBinanceSymbol } from "@/lib/market/symbols"

const CACHE_DIR = join(process.cwd(), "data", "klines-cache")

export function klinesCachePath(
  symbol: string,
  startTime: number,
  endTime: number,
): string {
  const binanceSymbol = toBinanceSymbol(symbol)
  return join(CACHE_DIR, `${binanceSymbol}-${startTime}-${endTime}.json`)
}

export async function readKlinesCache(path: string): Promise<MarketCandle[] | null> {
  try {
    const raw = await readFile(path, "utf-8")
    return JSON.parse(raw) as MarketCandle[]
  } catch {
    return null
  }
}

export async function writeKlinesCache(
  path: string,
  candles: MarketCandle[],
): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true })
  await writeFile(path, JSON.stringify(candles), "utf-8")
}

export interface FetchKlinesWithCacheOptions {
  throttleMs?: number
  forceRefresh?: boolean
}

export async function fetchKlinesWithCache(
  pair: string,
  startTime: number,
  endTime: number,
  options: FetchKlinesWithCacheOptions = {},
): Promise<MarketCandle[]> {
  const cachePath = klinesCachePath(pair, startTime, endTime)

  if (!options.forceRefresh) {
    const cached = await readKlinesCache(cachePath)
    if (cached) return cached
  }

  const symbol = toBinanceSymbol(pair)
  const candles = await fetchBinanceKlinesRange(symbol, "1m", startTime, endTime, {
    throttleMs: options.throttleMs ?? 200,
  })

  await writeKlinesCache(cachePath, candles)
  return candles
}
