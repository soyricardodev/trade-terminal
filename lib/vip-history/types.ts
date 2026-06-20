import type { ParsedVipSignal, TradeDirection } from "@/lib/signal-risk/types"

export type SignalOutcome =
  | "not_executed"
  | "risk_filtered"
  | "loss"
  | "breakeven"
  | "win"
  | "partial_win"
  | "full_win"
  | "timeout"
  | "inconclusive"
  | "no_data"

export type TimeoutTreatment = "market_close" | "inconclusive"

export type SkipReason = "parse_failed" | "symbol_not_listed"

export type ExitEventType =
  | "entry"
  | "tp1"
  | "tp2"
  | "tp3"
  | "sl"
  | "timeout_close"

export interface ExitEvent {
  type: ExitEventType
  time: number
  price: number
  weight: number
  pnlUsdt: number
}

export interface HistoricalSignal {
  id: number
  date: string
  signalTime: number
  rawText: string
  parsed: ParsedVipSignal
}

export interface SkippedSignal {
  id: number
  date: string
  signalTime: number
  rawText: string
  reason: SkipReason
}

export interface BacktestParams {
  marginUsdt: number
  leverage: number
  observationHours: number
  exitWeights: [number, number, number]
  moveSlToBreakevenAfterTp1: boolean
  capLossAtMargin: boolean
  maxRiskPctOfMargin: number | null
  skipHighRiskSignals: boolean
  timeoutTreatment: TimeoutTreatment
  excludeTimeoutsFromStats: boolean
}

export interface BacktestResult {
  signal: HistoricalSignal
  outcome: SignalOutcome
  entryPrice?: number
  entryTime?: number
  totalPnlUsdt: number
  totalRoiPct: number
  exits: ExitEvent[]
  tp1Hit: boolean
  tp2Hit: boolean
  tp3Hit: boolean
}

export interface SymbolBacktestStats {
  symbol: string
  total: number
  executed: number
  wins: number
  losses: number
  breakevens: number
  notExecuted: number
  winRate: number
  totalPnlUsdt: number
  avgPnlUsdt: number
  avgRoiPct: number
  tp1HitRate: number
  tp2HitRate: number
  tp3HitRate: number
}

export interface GlobalBacktestStats {
  totalSignals: number
  parsed: number
  skipped: number
  executed: number
  notExecuted: number
  riskFiltered: number
  wins: number
  losses: number
  breakevens: number
  timeouts: number
  inconclusive: number
  winRate: number
  totalPnlUsdt: number
  avgPnlUsdt: number
  avgRoiPct: number
  tp1HitRate: number
  tp2HitRate: number
  tp3HitRate: number
}

export interface BacktestStats {
  global: GlobalBacktestStats
  bySymbol: SymbolBacktestStats[]
}

export interface BacktestReport {
  generatedAt: string
  params: BacktestParams
  stats: BacktestStats
  results: BacktestResult[]
  skipped: SkippedSignal[]
}

export interface SimulateInput {
  signal: HistoricalSignal
  candles: import("@/lib/market/types").MarketCandle[]
  params: BacktestParams
}

export interface TelegramExportMessage {
  id: number
  type: string
  date: string
  date_unixtime: string
  full_text?: string
  text?: string
}

export interface TelegramExport {
  messages: TelegramExportMessage[]
}

export interface CleanSignalsExport {
  generatedAt: string
  count: number
  signals: HistoricalSignal[]
  skipped: SkippedSignal[]
}

export type OutcomeFilter = SignalOutcome | "all"
export type DirectionFilter = TradeDirection | "all"
