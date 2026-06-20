import type { MetricStripItem } from "@/components/signal-risk-suite/ui/metric-strip"
import { calculateUnrealizedPnl } from "@/lib/signal-risk/calculator"
import type { TradeSetup } from "@/lib/signal-risk/types"
import { formatPct, formatUsdt } from "@/lib/utils"

export function unrealizedPnlMetric(
  setup: TradeSetup,
  markPrice: number,
): MetricStripItem {
  const { pnlUsdt, roiPct, movePct } = calculateUnrealizedPnl(setup, markPrice)

  return {
    label: "Unrealized PnL",
    value: formatUsdt(pnlUsdt),
    tone: pnlUsdt > 0 ? "long" : pnlUsdt < 0 ? "short" : "muted",
    sub: `ROI ${formatPct(roiPct)} · ${movePct >= 0 ? "+" : ""}${movePct.toFixed(2)}% move`,
  }
}
