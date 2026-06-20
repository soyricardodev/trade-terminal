import type { MetricStripItem } from "@/components/signal-risk-suite/ui/metric-strip"
import type { RiskAnalysis } from "@/lib/signal-risk/types"
import { formatPct, formatUsdt } from "@/lib/utils"

export function worstCaseMetric(analysis: RiskAnalysis): MetricStripItem {
  return {
    label: "Worst case",
    value: formatUsdt(-analysis.maxLossUsdt),
    tone: "short",
    sub: `ROI ${formatPct(analysis.maxLossRoiPct)} · SL ${analysis.slMovePct.toFixed(2)}%`,
  }
}
