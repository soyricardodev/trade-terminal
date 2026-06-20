export type TradeDirection = "LONG" | "SHORT"

export interface TradeSetup {
  pair: string
  direction: TradeDirection
  entry: number
  stopLoss: number
  tp1: number
  tp2: number
  tp3: number
  marginUsdt: number
  leverage: number
}

export interface PhaseResult {
  phase: 1 | 2 | 3
  label: "TP1" | "TP2" | "TP3"
  weight: number
  targetPrice: number
  priceMovePct: number
  leveragedRoiPct: number
  pnlUsdt: number
  rrRatio: number
}

export interface RiskAnalysis {
  notional: number
  maxLossUsdt: number
  maxLossRoiPct: number
  slMovePct: number
  maxGainUsdt: number
  maxGainRoiPct: number
  phases: PhaseResult[]
}

export interface ParsedVipSignal {
  pair: string
  direction: TradeDirection
  entry: number
  entryMin?: number
  entryMax?: number
  entryIsRange: boolean
  stopLoss: number
  tp1: number
  tp2: number
  tp3: number
  warnings: string[]
}

export type JournalStatus = "open" | "win" | "loss" | "breakeven"

export interface JournalEntry {
  id: string
  createdAt: string
  closedAt?: string
  status: JournalStatus
  setup: TradeSetup
  analysis: RiskAnalysis
  source: "manual" | "vip-paste"
  rawSignal?: string
  actualEntry: number
  actualExit?: number
  pnlUsdt?: number
  notes?: string
}

export interface JournalStats {
  totalTrades: number
  openTrades: number
  closedTrades: number
  wins: number
  losses: number
  breakevens: number
  winRate: number
  totalPnlUsdt: number
}
