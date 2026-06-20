import type {
  PhaseResult,
  RiskAnalysis,
  TradeDirection,
  TradeSetup,
} from "./types"

export const EXIT_WEIGHTS = [0.5, 0.3, 0.2] as const

export function priceMovePct(
  entry: number,
  target: number,
  direction: TradeDirection,
): number {
  if (direction === "LONG") {
    return ((target - entry) / entry) * 100
  }
  return ((entry - target) / entry) * 100
}

export function calculateRiskAnalysis(setup: TradeSetup): RiskAnalysis {
  const notional = setup.marginUsdt * setup.leverage
  const slMovePct = Math.abs(
    priceMovePct(setup.entry, setup.stopLoss, setup.direction),
  )
  const maxLossUsdt = notional * (slMovePct / 100)
  const maxLossRoiPct = -(slMovePct * setup.leverage)

  const tpPrices = [setup.tp1, setup.tp2, setup.tp3] as const
  const tpLabels = ["TP1", "TP2", "TP3"] as const

  const phases: PhaseResult[] = tpPrices.map((targetPrice, index) => {
    const movePct = priceMovePct(setup.entry, targetPrice, setup.direction)
    const weight = EXIT_WEIGHTS[index]
    const leveragedRoiPct = movePct * setup.leverage
    const pnlUsdt = notional * weight * (movePct / 100)
    const rrRatio = slMovePct > 0 ? movePct / slMovePct : 0

    return {
      phase: (index + 1) as 1 | 2 | 3,
      label: tpLabels[index],
      weight,
      targetPrice,
      priceMovePct: movePct,
      leveragedRoiPct,
      pnlUsdt,
      rrRatio,
    }
  })

  const maxGainUsdt = phases.reduce((sum, phase) => sum + phase.pnlUsdt, 0)
  const maxGainRoiPct = (maxGainUsdt / setup.marginUsdt) * 100

  return {
    notional,
    maxLossUsdt,
    maxLossRoiPct,
    slMovePct,
    maxGainUsdt,
    maxGainRoiPct,
    phases,
  }
}

export function calculateUnrealizedPnl(
  setup: TradeSetup,
  markPrice: number,
): { pnlUsdt: number; roiPct: number; movePct: number } {
  const pnlUsdt = calculateActualPnlUsdt(setup, setup.entry, markPrice)
  const movePct = priceMovePct(setup.entry, markPrice, setup.direction)
  const roiPct =
    setup.marginUsdt > 0 ? (pnlUsdt / setup.marginUsdt) * 100 : 0

  return { pnlUsdt, roiPct, movePct }
}

export function calculateActualPnlUsdt(
  setup: Pick<TradeSetup, "direction" | "entry" | "marginUsdt" | "leverage">,
  actualEntry: number,
  actualExit: number,
): number {
  const notional = setup.marginUsdt * setup.leverage
  const priceChangePct =
    setup.direction === "LONG"
      ? (actualExit - actualEntry) / actualEntry
      : (actualEntry - actualExit) / actualEntry
  return notional * priceChangePct
}

export function resolveJournalStatus(
  pnlUsdt: number,
): "win" | "loss" | "breakeven" {
  if (pnlUsdt > 0) return "win"
  if (pnlUsdt < 0) return "loss"
  return "breakeven"
}
