import { priceMovePct } from "@/lib/signal-risk/calculator"
import type { TradeDirection } from "@/lib/signal-risk/types"

import type { BacktestResult, SignalOutcome } from "./types"

const EXECUTED_OUTCOMES: SignalOutcome[] = [
  "loss",
  "breakeven",
  "win",
  "partial_win",
  "full_win",
  "timeout",
  "inconclusive",
]

const WIN_OUTCOMES: SignalOutcome[] = ["win", "partial_win", "full_win"]

export interface DirectionStats {
  direction: TradeDirection
  total: number
  executed: number
  wins: number
  losses: number
  timeouts: number
  winRate: number
  totalPnlUsdt: number
  avgPnlUsdt: number
}

export interface SlDistanceBucket {
  label: string
  minPct: number
  maxPct: number
  count: number
  winRate: number
  avgPnlUsdt: number
  totalPnlUsdt: number
}

export interface TimeToTp1Stats {
  samples: number
  avgMinutes: number
  medianMinutes: number
  under1h: number
  under4h: number
  over12h: number
}

export interface VipHistoryAnalytics {
  byDirection: DirectionStats[]
  slDistanceBuckets: SlDistanceBucket[]
  timeToTp1: TimeToTp1Stats
}

function pct(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0
  return (numerator / denominator) * 100
}

function isExecuted(outcome: SignalOutcome): boolean {
  return EXECUTED_OUTCOMES.includes(outcome)
}

function isWin(outcome: SignalOutcome): boolean {
  return WIN_OUTCOMES.includes(outcome)
}

export function slDistancePct(result: BacktestResult): number | null {
  if (result.entryPrice === undefined) return null
  return Math.abs(
    priceMovePct(
      result.entryPrice,
      result.signal.parsed.stopLoss,
      result.signal.parsed.direction,
    ),
  )
}

function buildDirectionStats(
  direction: TradeDirection,
  results: BacktestResult[],
): DirectionStats {
  const subset = results.filter((result) => result.signal.parsed.direction === direction)
  const executed = subset.filter((result) => isExecuted(result.outcome))
  const wins = executed.filter((result) => isWin(result.outcome))
  const losses = executed.filter((result) => result.outcome === "loss")
  const timeouts = executed.filter(
    (result) => result.outcome === "timeout" || result.outcome === "inconclusive",
  )
  const totalPnlUsdt = executed.reduce((sum, result) => sum + result.totalPnlUsdt, 0)

  return {
    direction,
    total: subset.length,
    executed: executed.length,
    wins: wins.length,
    losses: losses.length,
    timeouts: timeouts.length,
    winRate: pct(wins.length, executed.length),
    totalPnlUsdt,
    avgPnlUsdt: executed.length > 0 ? totalPnlUsdt / executed.length : 0,
  }
}

const SL_BUCKETS: Array<{ label: string; minPct: number; maxPct: number }> = [
  { label: "< 2%", minPct: 0, maxPct: 2 },
  { label: "2–5%", minPct: 2, maxPct: 5 },
  { label: "5–10%", minPct: 5, maxPct: 10 },
  { label: "10–15%", minPct: 10, maxPct: 15 },
  { label: "> 15%", minPct: 15, maxPct: Infinity },
]

function buildSlDistanceBuckets(results: BacktestResult[]): SlDistanceBucket[] {
  return SL_BUCKETS.map((bucket) => {
    const subset = results.filter((result) => {
      if (!isExecuted(result.outcome)) return false
      const distance = slDistancePct(result)
      if (distance === null) return false
      return distance >= bucket.minPct && distance < bucket.maxPct
    })

    const wins = subset.filter((result) => isWin(result.outcome))
    const totalPnlUsdt = subset.reduce((sum, result) => sum + result.totalPnlUsdt, 0)

    return {
      label: bucket.label,
      minPct: bucket.minPct,
      maxPct: bucket.maxPct,
      count: subset.length,
      winRate: pct(wins.length, subset.length),
      avgPnlUsdt: subset.length > 0 ? totalPnlUsdt / subset.length : 0,
      totalPnlUsdt,
    }
  })
}

function buildTimeToTp1Stats(results: BacktestResult[]): TimeToTp1Stats {
  const durations = results
    .filter((result) => result.tp1Hit && result.entryTime !== undefined)
    .map((result) => {
      const tp1Exit = result.exits.find((event) => event.type === "tp1")
      if (!tp1Exit) return null
      return (tp1Exit.time - result.entryTime!) / 60
    })
    .filter((value): value is number => value !== null)
    .sort((a, b) => a - b)

  if (durations.length === 0) {
    return {
      samples: 0,
      avgMinutes: 0,
      medianMinutes: 0,
      under1h: 0,
      under4h: 0,
      over12h: 0,
    }
  }

  const avgMinutes = durations.reduce((sum, value) => sum + value, 0) / durations.length
  const medianMinutes = durations[Math.floor(durations.length / 2)] ?? 0

  return {
    samples: durations.length,
    avgMinutes,
    medianMinutes,
    under1h: durations.filter((value) => value <= 60).length,
    under4h: durations.filter((value) => value <= 240).length,
    over12h: durations.filter((value) => value > 720).length,
  }
}

export function buildVipHistoryAnalytics(results: BacktestResult[]): VipHistoryAnalytics {
  return {
    byDirection: [
      buildDirectionStats("LONG", results),
      buildDirectionStats("SHORT", results),
    ],
    slDistanceBuckets: buildSlDistanceBuckets(results),
    timeToTp1: buildTimeToTp1Stats(results),
  }
}
