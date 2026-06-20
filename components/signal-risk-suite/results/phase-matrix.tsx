import type { PhaseResult } from "@/lib/signal-risk/types"

import { PhaseCell } from "./phase-card"

interface PhaseMatrixProps {
  phases: PhaseResult[]
}

export function PhaseMatrix({ phases }: PhaseMatrixProps) {
  return (
    <div className="min-w-0">
      <h3 className="mb-2 text-xs font-medium text-muted-foreground">
        TP phase matrix · 50/30/20
      </h3>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {phases.map((phase) => (
          <PhaseCell key={phase.label} phase={phase} />
        ))}
      </div>
    </div>
  )
}
