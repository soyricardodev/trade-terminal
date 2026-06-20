import type { MetricStripItem } from "@/components/signal-risk-suite/ui/metric-strip"
import type { RiskAnalysis } from "@/lib/signal-risk/types"
import { formatPct, formatUsdt } from "@/lib/utils"

export function bestCaseMetric(analysis: RiskAnalysis): MetricStripItem {
  return {
    label: "Best case",
    value: formatUsdt(analysis.maxGainUsdt),
    tone: "long",
    sub: `ROI ${formatPct(analysis.maxGainRoiPct)} on margin`,
  }
}

export function notionalMetric(analysis: RiskAnalysis): MetricStripItem {
  return {
    label: "Notional",
    value: `${analysis.notional.toFixed(0)} USDT`,
    tone: "muted",
  }
}

export function leverageMetric(leverage: number): MetricStripItem {
  return {
    label: "Leverage",
    value: `${leverage}x`,
    tone: "gold",
  }
}
