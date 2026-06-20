"use client"

import dynamic from "next/dynamic"
import { useMemo, useState } from "react"

import { buildTradeMarkers } from "@/components/signal-risk-suite/chart/trade-markers"
import { useHistoricalKlines } from "@/hooks/use-historical-klines"
import type { ChartInterval } from "@/lib/market/types"
import type { TradeSetup } from "@/lib/signal-risk/types"
import type { BacktestParams, BacktestResult } from "@/lib/vip-history/types"
import { cn, formatPrice, formatUsdt } from "@/lib/utils"

const HISTORY_CHART_INTERVALS: ChartInterval[] = ["15m", "1h", "4h"]

const PriceLevelChart = dynamic(
  () =>
    import("@/components/signal-risk-suite/chart/price-level-chart").then(
      (module) => module.PriceLevelChart,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-48 animate-pulse items-center justify-center bg-chart-bg text-xs text-muted-foreground sm:h-56 lg:h-80">
        Loading chart…
      </div>
    ),
  },
)

interface VipSignalDetailProps {
  result: BacktestResult | null
  params: BacktestParams
}

function buildSetup(result: BacktestResult, params: BacktestParams): TradeSetup {
  const { parsed } = result.signal
  return {
    pair: parsed.pair,
    direction: parsed.direction,
    entry: result.entryPrice ?? parsed.entry,
    stopLoss: parsed.stopLoss,
    tp1: parsed.tp1,
    tp2: parsed.tp2,
    tp3: parsed.tp3,
    marginUsdt: params.marginUsdt,
    leverage: params.leverage,
  }
}

function exitLabel(type: BacktestResult["exits"][number]["type"]): string {
  switch (type) {
    case "entry":
      return "Entry"
    case "tp1":
      return "TP1"
    case "tp2":
      return "TP2"
    case "tp3":
      return "TP3"
    case "sl":
      return "Stop loss"
    case "timeout_close":
      return "Timeout close"
    default: {
      const _exhaustive: never = type
      return _exhaustive
    }
  }
}

export function VipSignalDetail({ result, params }: VipSignalDetailProps) {
  const [interval, setChartInterval] = useState<ChartInterval>("15m")

  const timeRange = useMemo(() => {
    if (!result) return null
    const startTimeMs = result.signal.signalTime
    const endTimeMs =
      startTimeMs + params.observationHours * 60 * 60 * 1000
    return { startTimeMs, endTimeMs }
  }, [result, params.observationHours])

  const { candles, status, lastPrice, error, scopeKey } = useHistoricalKlines(
    result?.signal.parsed.pair ?? "",
    {
      enabled: Boolean(result && timeRange),
      startTimeMs: timeRange?.startTimeMs ?? 0,
      endTimeMs: timeRange?.endTimeMs ?? 0,
      interval,
    },
  )

  const markers = useMemo(
    () =>
      result
        ? buildTradeMarkers(result.exits, result.signal.parsed.direction)
        : [],
    [result],
  )

  if (!result) {
    return (
      <p className="text-sm text-muted-foreground">
        Select a signal to inspect exits and historical chart.
      </p>
    )
  }

  const setup = buildSetup(result, params)

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-2 text-xs sm:grid-cols-2">
        <div>
          <p className="text-muted-foreground">Outcome</p>
          <p className="font-medium capitalize">{result.outcome.replace("_", " ")}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Simulated PnL</p>
          <p
            className={cn(
              "font-mono font-medium tabular-nums",
              result.totalPnlUsdt > 0
                ? "text-long"
                : result.totalPnlUsdt < 0
                  ? "text-short"
                  : "text-muted-foreground",
            )}
          >
            {formatUsdt(result.totalPnlUsdt)}
          </p>
        </div>
      </div>

      <div>
        <p className="mb-1 text-xs font-medium text-muted-foreground">Exit timeline</p>
        <ul className="space-y-1 text-xs">
          {result.exits.map((event, index) => (
            <li
              key={`${event.type}-${event.time}-${index}`}
              className="flex items-center justify-between border-b border-border/50 py-1"
            >
              <span>{exitLabel(event.type)}</span>
              <span className="font-mono tabular-nums">
                {formatPrice(event.price)} · {formatUsdt(event.pnlUsdt)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <PriceLevelChart
        key={result.signal.id}
        setup={setup}
        pair={result.signal.parsed.pair}
        interval={interval}
        onIntervalChange={setChartInterval}
        intervals={HISTORY_CHART_INTERVALS}
        candles={candles}
        status={status}
        lastPrice={lastPrice}
        scopeKey={scopeKey}
        isLive={false}
        allowSyntheticFallback={false}
        markers={markers}
        error={error}
      />

      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground">
          Raw VIP signal
        </summary>
        <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap border border-border bg-background p-2 font-mono text-[11px]">
          {result.signal.rawText}
        </pre>
      </details>
    </div>
  )
}
