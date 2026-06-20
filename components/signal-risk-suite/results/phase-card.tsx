import type { PhaseResult } from "@/lib/signal-risk/types"
import { cn, formatPct, formatPrice, formatRatio, formatUsdt } from "@/lib/utils"

interface PhaseCellProps {
  phase: PhaseResult
  className?: string
}

export function PhaseCell({ phase, className }: PhaseCellProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-2 border border-border bg-elevated p-3",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{phase.label}</span>
        <span className="font-mono text-xs text-muted-foreground">
          {(phase.weight * 100).toFixed(0)}% exit
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
        <div>
          <dt className="text-muted-foreground">Target</dt>
          <dd className="font-mono tabular-nums">
            {formatPrice(phase.targetPrice)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Move</dt>
          <dd className="font-mono tabular-nums text-long">
            {formatPct(phase.priceMovePct)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">ROI</dt>
          <dd className="font-mono tabular-nums text-long">
            {formatPct(phase.leveragedRoiPct)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">PnL</dt>
          <dd className="font-mono tabular-nums text-long">
            {formatUsdt(phase.pnlUsdt)}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-muted-foreground">R:R</dt>
          <dd className="font-mono tabular-nums">{formatRatio(phase.rrRatio)}</dd>
        </div>
      </dl>
    </div>
  )
}
