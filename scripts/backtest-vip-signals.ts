#!/usr/bin/env bun

import { copyFile, mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"

import { fetchUsdtPerpetualSymbols } from "@/lib/market/exchange-info"
import { DEFAULT_BACKTEST_PARAMS } from "@/lib/vip-history/params"
import { aggregateBacktestStats } from "@/lib/vip-history/stats"
import { fetchKlinesWithCache } from "@/lib/vip-history/klines-cache"
import {
  simulateVipSignal,
} from "@/lib/vip-history/simulator"
import {
  buildListedSymbolSet,
  importVipSignalsFromFile,
} from "@/lib/vip-history/telegram-import"
import type {
  BacktestParams,
  BacktestReport,
  CleanSignalsExport,
} from "@/lib/vip-history/types"

interface CliArgs {
  input: string
  output: string
  cleanOutput: string
  publicOutput: string
  hours: number
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    input: "result.json",
    output: "data/vip-backtest-results.json",
    cleanOutput: "data/vip-signals-clean.json",
    publicOutput: "public/data/vip-backtest-results.json",
    hours: DEFAULT_BACKTEST_PARAMS.observationHours,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    const next = argv[index + 1]

    switch (token) {
      case "--input":
        if (next) args.input = next
        index += 1
        break
      case "--output":
        if (next) args.output = next
        index += 1
        break
      case "--hours":
        if (next) args.hours = Number.parseFloat(next)
        index += 1
        break
      default:
        break
    }
  }

  return args
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))
  const params: BacktestParams = {
    ...DEFAULT_BACKTEST_PARAMS,
    observationHours: args.hours,
  }

  console.log(`Importing VIP signals from ${args.input}...`)
  const listedSymbols = buildListedSymbolSet(await fetchUsdtPerpetualSymbols())
  const { signals, skipped } = importVipSignalsFromFile(args.input, listedSymbols)

  console.log(`Parsed ${signals.length} signals (${skipped.length} skipped)`)

  const cleanExport: CleanSignalsExport = {
    generatedAt: new Date().toISOString(),
    count: signals.length,
    signals,
    skipped,
  }

  await mkdir(join(process.cwd(), "data"), { recursive: true })
  await writeFile(args.cleanOutput, JSON.stringify(cleanExport, null, 2), "utf-8")
  console.log(`Wrote ${args.cleanOutput}`)

  const results = []
  let index = 0

  for (const signal of signals) {
    index += 1
    const endTime = signal.signalTime + params.observationHours * 60 * 60 * 1000

    process.stdout.write(
      `[${index}/${signals.length}] ${signal.parsed.pair} ${signal.parsed.direction}... `,
    )

    try {
      const candles = await fetchKlinesWithCache(
        signal.parsed.pair,
        signal.signalTime,
        endTime,
        { throttleMs: 200 },
      )

      const result = simulateVipSignal({ signal, candles, params })
      results.push(result)
      console.log(result.outcome)
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error"
      console.log(`error (${message})`)
      results.push(
        simulateVipSignal({
          signal,
          candles: [],
          params,
        }),
      )
    }
  }

  const report: BacktestReport = {
    generatedAt: new Date().toISOString(),
    params,
    stats: aggregateBacktestStats(results, skipped, {
      excludeTimeoutsFromStats: params.excludeTimeoutsFromStats,
    }),
    results,
    skipped,
  }

  await writeFile(args.output, JSON.stringify(report, null, 2), "utf-8")
  console.log(`Wrote ${args.output}`)

  await mkdir(join(process.cwd(), "public", "data"), { recursive: true })
  await copyFile(args.output, args.publicOutput)
  console.log(`Copied to ${args.publicOutput}`)

  const { global: stats } = report.stats
  console.log("\nSummary:")
  console.log(`  Executed: ${stats.executed}/${stats.parsed}`)
  console.log(`  Win rate: ${stats.winRate.toFixed(1)}%`)
  console.log(`  Total PnL: ${stats.totalPnlUsdt.toFixed(2)} USDT`)
  console.log(`  Avg ROI: ${stats.avgRoiPct.toFixed(2)}%`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
