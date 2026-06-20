export type ChartInterval = "1m" | "15m" | "1h" | "4h"

export const CHART_INTERVALS: ChartInterval[] = ["1m", "15m", "1h", "4h"]

export const KLINE_INTERVALS = CHART_INTERVALS

export type KlineInterval = ChartInterval

export interface MarketCandle {
  time: number
  open: number
  high: number
  low: number
  close: number
}

export interface MarketSymbol {
  symbol: string
  display: string
  baseAsset: string
  quoteAsset: string
}

export type KlineStreamStatus = "connecting" | "connected" | "disconnected" | "paused"

export type MarketKlinesStatus =
  | "idle"
  | "loading"
  | "ready"
  | "streaming"
  | "fallback"
  | "error"
