import type {
  BacktestResult,
  BacktestStats,
  GlobalBacktestStats,
  SignalOutcome,
  SkippedSignal,
  SymbolBacktestStats,
} from "./types"

const WIN_OUTCOMES: SignalOutcome[] = ["win", "partial_win", "full_win"]
const LOSS_OUTCOMES: SignalOutcome[] = ["loss"]
const EXECUTED_OUTCOMES: SignalOutcome[] = [
  "loss",
  "breakeven",
  "win",
  "partial_win",
  "full_win",
  "timeout",
  "inconclusive",
]

function isWin(outcome: SignalOutcome): boolean {
  return WIN_OUTCOMES.includes(outcome)
}

function isLoss(outcome: SignalOutcome): boolean {
  return LOSS_OUTCOMES.includes(outcome)
}

function isExecuted(outcome: SignalOutcome): boolean {
  return EXECUTED_OUTCOMES.includes(outcome)
}

function pct(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0
  return (numerator / denominator) * 100
}

function buildSymbolStats(
  symbol: string,
  results: BacktestResult[],
): SymbolBacktestStats {
  const executed = results.filter((result) => isExecuted(result.outcome))
  const wins = executed.filter((result) => isWin(result.outcome))
  const losses = executed.filter((result) => isLoss(result.outcome))
  const breakevens = executed.filter((result) => result.outcome === "breakeven")
  const notExecuted = results.filter((result) => result.outcome === "not_executed")
  const totalPnlUsdt = executed.reduce((sum, result) => sum + result.totalPnlUsdt, 0)
  const avgPnlUsdt = executed.length > 0 ? totalPnlUsdt / executed.length : 0
  const avgRoiPct =
    executed.length > 0
      ? executed.reduce((sum, result) => sum + result.totalRoiPct, 0) / executed.length
      : 0

  return {
    symbol,
    total: results.length,
    executed: executed.length,
    wins: wins.length,
    losses: losses.length,
    breakevens: breakevens.length,
    notExecuted: notExecuted.length,
    winRate: pct(wins.length, executed.length),
    totalPnlUsdt,
    avgPnlUsdt,
    avgRoiPct,
    tp1HitRate: pct(
      executed.filter((result) => result.tp1Hit).length,
      executed.length,
    ),
    tp2HitRate: pct(
      executed.filter((result) => result.tp2Hit).length,
      executed.length,
    ),
    tp3HitRate: pct(
      executed.filter((result) => result.tp3Hit).length,
      executed.length,
    ),
  }
}

function shouldIncludeInStats(
  result: BacktestResult,
  excludeTimeoutsFromStats: boolean,
): boolean {
  if (!isExecuted(result.outcome)) return false
  if (!excludeTimeoutsFromStats) return true
  return result.outcome !== "timeout" && result.outcome !== "inconclusive"
}

function buildGlobalStats(
  results: BacktestResult[],
  skipped: SkippedSignal[],
  excludeTimeoutsFromStats = false,
): GlobalBacktestStats {
  const executedAll = results.filter((result) => isExecuted(result.outcome))
  const executed = results.filter((result) =>
    shouldIncludeInStats(result, excludeTimeoutsFromStats),
  )
  const wins = executed.filter((result) => isWin(result.outcome))
  const losses = executed.filter((result) => isLoss(result.outcome))
  const breakevens = executed.filter((result) => result.outcome === "breakeven")
  const timeouts = executedAll.filter((result) => result.outcome === "timeout")
  const inconclusive = executedAll.filter((result) => result.outcome === "inconclusive")
  const notExecuted = results.filter((result) => result.outcome === "not_executed")
  const riskFiltered = results.filter((result) => result.outcome === "risk_filtered")
  const totalPnlUsdt = executed.reduce((sum, result) => sum + result.totalPnlUsdt, 0)

  return {
    totalSignals: results.length + skipped.length,
    parsed: results.length,
    skipped: skipped.length,
    executed: executedAll.length,
    notExecuted: notExecuted.length,
    riskFiltered: riskFiltered.length,
    wins: wins.length,
    losses: losses.length,
    breakevens: breakevens.length,
    timeouts: timeouts.length,
    inconclusive: inconclusive.length,
    winRate: pct(wins.length, executed.length),
    totalPnlUsdt,
    avgPnlUsdt: executed.length > 0 ? totalPnlUsdt / executed.length : 0,
    avgRoiPct:
      executed.length > 0
        ? executed.reduce((sum, result) => sum + result.totalRoiPct, 0) /
          executed.length
        : 0,
    tp1HitRate: pct(
      executed.filter((result) => result.tp1Hit).length,
      executed.length,
    ),
    tp2HitRate: pct(
      executed.filter((result) => result.tp2Hit).length,
      executed.length,
    ),
    tp3HitRate: pct(
      executed.filter((result) => result.tp3Hit).length,
      executed.length,
    ),
  }
}

export function aggregateBacktestStats(
  results: BacktestResult[],
  skipped: SkippedSignal[],
  options: { excludeTimeoutsFromStats?: boolean } = {},
): BacktestStats {
  const excludeTimeoutsFromStats = options.excludeTimeoutsFromStats ?? false
  const bySymbolMap = new Map<string, BacktestResult[]>()

  for (const result of results) {
    const symbol = result.signal.parsed.pair
    const bucket = bySymbolMap.get(symbol) ?? []
    bucket.push(result)
    bySymbolMap.set(symbol, bucket)
  }

  const bySymbol = [...bySymbolMap.entries()]
    .map(([symbol, symbolResults]) => buildSymbolStats(symbol, symbolResults))
    .sort((a, b) => b.totalPnlUsdt - a.totalPnlUsdt)

  return {
    global: buildGlobalStats(results, skipped, excludeTimeoutsFromStats),
    bySymbol,
  }
}
