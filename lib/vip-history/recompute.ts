import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { fetchKlinesWithCache } from "@/lib/vip-history/klines-cache"
import { DEFAULT_BACKTEST_PARAMS } from "@/lib/vip-history/params"
import { simulateVipSignal } from "@/lib/vip-history/simulator"
import { aggregateBacktestStats } from "@/lib/vip-history/stats"
import type {
  BacktestParams,
  BacktestReport,
  CleanSignalsExport,
  HistoricalSignal,
  SkippedSignal,
} from "@/lib/vip-history/types"

const CLEAN_SIGNALS_PATH = join(process.cwd(), "data", "vip-signals-clean.json")

export interface RecomputeProgress {
  completed: number
  total: number
}

export async function loadCleanSignals(): Promise<{
  signals: HistoricalSignal[]
  skipped: SkippedSignal[]
}> {
  try {
    const raw = await readFile(CLEAN_SIGNALS_PATH, "utf-8")
    const exportData = JSON.parse(raw) as CleanSignalsExport
    return { signals: exportData.signals, skipped: exportData.skipped ?? [] }
  } catch {
    return { signals: [], skipped: [] }
  }
}

export async function recomputeBacktestReport(
  params: BacktestParams,
  options: {
    signals?: HistoricalSignal[]
    skipped?: SkippedSignal[]
    onProgress?: (progress: RecomputeProgress) => void
  } = {},
): Promise<BacktestReport> {
  const loaded = options.signals
    ? { signals: options.signals, skipped: options.skipped ?? [] }
    : await loadCleanSignals()

  const { signals, skipped } = loaded
  const results = []

  for (let index = 0; index < signals.length; index += 1) {
    const signal = signals[index]!
    const endTime = signal.signalTime + params.observationHours * 60 * 60 * 1000

    try {
      const candles = await fetchKlinesWithCache(
        signal.parsed.pair,
        signal.signalTime,
        endTime,
        { throttleMs: 0 },
      )
      results.push(simulateVipSignal({ signal, candles, params }))
    } catch {
      results.push(
        simulateVipSignal({
          signal,
          candles: [],
          params,
        }),
      )
    }

    options.onProgress?.({ completed: index + 1, total: signals.length })
  }

  return {
    generatedAt: new Date().toISOString(),
    params: { ...DEFAULT_BACKTEST_PARAMS, ...params },
    stats: aggregateBacktestStats(results, skipped, {
      excludeTimeoutsFromStats: params.excludeTimeoutsFromStats,
    }),
    results,
    skipped,
  }
}
