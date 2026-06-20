"use client"

import type { BacktestParams, GlobalBacktestStats } from "@/lib/vip-history/types"
import { formatUsdt } from "@/lib/utils"

interface VipHistoryInsightsProps {
  stats: GlobalBacktestStats
  params: BacktestParams
}

export function VipHistoryInsights({ stats, params }: VipHistoryInsightsProps) {
  const exampleSlPct = 5
  const exampleLossUsdt =
    params.marginUsdt * params.leverage * (exampleSlPct / 100)
  const exampleLossRoi = (exampleLossUsdt / params.marginUsdt) * 100

  return (
    <div className="space-y-2 border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground">
      <p className="font-medium text-foreground">Why can losses reach hundreds of USDT?</p>
      <p>
        With {formatUsdt(params.marginUsdt)} margin at {params.leverage}x, notional is{" "}
        {formatUsdt(params.marginUsdt * params.leverage)}. A stop loss{" "}
        {exampleSlPct}% away from entry costs ~{formatUsdt(exampleLossUsdt)} (
        {exampleLossRoi.toFixed(0)}% of margin) on a full stop-out.
      </p>
      <p>
        Franco&apos;s stops are risk-managed for the trade, not capped at 1–2% of account.
        Some signals place SL 15–25% away — at 5x that is 75–125% of margin before
        liquidation. The simulator uses the plan SL literally, so a single full loss can
        exceed your margin in the math.
      </p>
      <p>
        Aggregate PnL also includes partial wins (TP1 then breakeven on remainder), timeouts
        at market close, and {stats.losses} full stop-outs across {stats.executed} executed
        trades. Win rate ({stats.winRate.toFixed(1)}%) counts partial wins; total PnL is what
        matters for profitability.
      </p>
    </div>
  )
}
