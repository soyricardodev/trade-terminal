"use client"

import dynamic from "next/dynamic"

import {
  buildLevelsFromSetup,
  PriceLadder,
} from "@/components/signal-risk-suite/chart/price-ladder"
import {
  bestCaseMetric,
  leverageMetric,
  notionalMetric,
} from "@/components/signal-risk-suite/results/best-case-card"
import { PhaseMatrix } from "@/components/signal-risk-suite/results/phase-matrix"
import { unrealizedPnlMetric } from "@/components/signal-risk-suite/results/unrealized-pnl-metric"
import { worstCaseMetric } from "@/components/signal-risk-suite/results/worst-case-card"
import { MetricStrip } from "@/components/signal-risk-suite/ui/metric-strip"
import { PanelSection } from "@/components/signal-risk-suite/ui/panel-section"
import { useMarketKlines } from "@/hooks/use-market-klines"
import type { ChartInterval } from "@/lib/market/types"
import type { RiskAnalysis, TradeSetup } from "@/lib/signal-risk/types"

const PriceLevelChart = dynamic(
  () =>
    import("@/components/signal-risk-suite/chart/price-level-chart").then(
      (m) => m.PriceLevelChart,
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

interface RiskDashboardProps {
  analysis: RiskAnalysis
  setup: TradeSetup
  pair: string
  interval: ChartInterval
  onIntervalChange: (interval: ChartInterval) => void
  markPrice?: number | null
}

export function RiskDashboard({
  analysis,
  setup,
  pair,
  interval,
  onIntervalChange,
  markPrice,
}: RiskDashboardProps) {
  const levels = buildLevelsFromSetup(setup)
  const { candles, status, lastPrice, isLive, error } = useMarketKlines(
    pair,
    interval,
  )

  const livePrice = markPrice ?? lastPrice ?? setup.entry
  const metrics = [
    unrealizedPnlMetric(setup, livePrice),
    worstCaseMetric(analysis),
    bestCaseMetric(analysis),
    notionalMetric(analysis),
    leverageMetric(setup.leverage),
  ]

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <MetricStrip items={metrics} />

      <PanelSection title={`${pair} · price levels`} className="[&>div:last-child]:p-0">
        <div className="flex min-w-0 flex-col min-[360px]:flex-row">
          <PriceLevelChart
            setup={setup}
            pair={pair}
            interval={interval}
            onIntervalChange={onIntervalChange}
            candles={candles}
            status={status}
            lastPrice={lastPrice ?? markPrice ?? null}
            isLive={isLive}
            error={error}
            className="w-full min-[360px]:flex-1"
          />
          <PriceLadder levels={levels} className="hidden min-[360px]:flex" />
        </div>
        <PriceLadder levels={levels} compact className="min-[360px]:hidden" />
      </PanelSection>

      <PanelSection>
        <PhaseMatrix phases={analysis.phases} />
      </PanelSection>
    </div>
  )
}
