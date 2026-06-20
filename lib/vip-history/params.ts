import type { BacktestParams } from "./types"

export type ExitStrategyPresetId = "50-30-20" | "100-tp1" | "100-tp2" | "100-tp3"

export interface ExitStrategyPreset {
  id: ExitStrategyPresetId
  label: string
  description: string
  exitWeights: [number, number, number]
  moveSlToBreakevenAfterTp1: boolean
}

export const EXIT_STRATEGY_PRESETS: ExitStrategyPreset[] = [
  {
    id: "50-30-20",
    label: "50 / 30 / 20",
    description: "Franco-style partial exits; SL moves to entry after TP1",
    exitWeights: [0.5, 0.3, 0.2],
    moveSlToBreakevenAfterTp1: true,
  },
  {
    id: "100-tp1",
    label: "100% @ TP1",
    description: "Close entire position at TP1",
    exitWeights: [1, 0, 0],
    moveSlToBreakevenAfterTp1: false,
  },
  {
    id: "100-tp2",
    label: "100% @ TP2",
    description: "Hold full size until TP2",
    exitWeights: [0, 1, 0],
    moveSlToBreakevenAfterTp1: false,
  },
  {
    id: "100-tp3",
    label: "100% @ TP3",
    description: "Hold full size until TP3",
    exitWeights: [0, 0, 1],
    moveSlToBreakevenAfterTp1: false,
  },
]

export const LEVERAGE_OPTIONS = [3, 5, 6, 10, 20, 25, 50, 75, 125] as const

export type LeverageOption = (typeof LEVERAGE_OPTIONS)[number]

export interface MaxRiskPreset {
  id: string
  label: string
  description: string
  maxRiskPctOfMargin: number | null
}

export const MAX_RISK_PRESETS: MaxRiskPreset[] = [
  {
    id: "off",
    label: "Full signal size",
    description: "Use Franco’s SL at full margin × leverage",
    maxRiskPctOfMargin: null,
  },
  {
    id: "pro-2",
    label: "Professional 2%",
    description: "Max 2% of margin at risk per trade (industry standard)",
    maxRiskPctOfMargin: 2,
  },
  {
    id: "pro-3",
    label: "Conservative 3%",
    description: "Max 3% of margin at risk per trade",
    maxRiskPctOfMargin: 3,
  },
  {
    id: "moderate-5",
    label: "Moderate 5%",
    description: "Max 5% of margin at risk per trade",
    maxRiskPctOfMargin: 5,
  },
  {
    id: "aggressive-10",
    label: "Aggressive 10%",
    description: "Max 10% of margin at risk per trade",
    maxRiskPctOfMargin: 10,
  },
]

export const DEFAULT_BACKTEST_PARAMS: BacktestParams = {
  marginUsdt: 1000,
  leverage: 5,
  observationHours: 24,
  exitWeights: [0.5, 0.3, 0.2],
  moveSlToBreakevenAfterTp1: true,
  capLossAtMargin: false,
  maxRiskPctOfMargin: null,
  skipHighRiskSignals: false,
  timeoutTreatment: "market_close",
  excludeTimeoutsFromStats: false,
}

export function presetById(id: ExitStrategyPresetId): ExitStrategyPreset {
  const preset = EXIT_STRATEGY_PRESETS.find((item) => item.id === id)
  if (!preset) {
    throw new Error(`Unknown exit strategy preset: ${id}`)
  }
  return preset
}

export function paramsFromPreset(
  presetId: ExitStrategyPresetId,
  overrides: Partial<Omit<BacktestParams, "exitWeights" | "moveSlToBreakevenAfterTp1">> = {},
): BacktestParams {
  const preset = presetById(presetId)
  return {
    ...DEFAULT_BACKTEST_PARAMS,
    ...overrides,
    exitWeights: [...preset.exitWeights],
    moveSlToBreakevenAfterTp1: preset.moveSlToBreakevenAfterTp1,
  }
}

export function detectMaxRiskPresetId(
  maxRiskPctOfMargin: number | null,
): string {
  const match = MAX_RISK_PRESETS.find(
    (preset) => preset.maxRiskPctOfMargin === maxRiskPctOfMargin,
  )
  return match?.id ?? "custom"
}

export function maxRiskPresetById(id: string): MaxRiskPreset | undefined {
  return MAX_RISK_PRESETS.find((preset) => preset.id === id)
}

export function normalizeExitWeights(
  weights: [number, number, number],
): [number, number, number] {
  const sum = weights[0] + weights[1] + weights[2]
  if (sum <= 0) return [1, 0, 0]
  return [weights[0] / sum, weights[1] / sum, weights[2] / sum]
}
