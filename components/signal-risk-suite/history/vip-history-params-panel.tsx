"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DEFAULT_BACKTEST_PARAMS,
  detectMaxRiskPresetId,
  EXIT_STRATEGY_PRESETS,
  LEVERAGE_OPTIONS,
  MAX_RISK_PRESETS,
  type ExitStrategyPresetId,
} from "@/lib/vip-history/params"
import type { BacktestParams } from "@/lib/vip-history/types"

interface VipHistoryParamsPanelProps {
  params: BacktestParams
  onChange: (params: BacktestParams) => void
  onRecompute: () => void
  recomputing: boolean
}

function detectPresetId(params: BacktestParams): ExitStrategyPresetId | "custom" {
  for (const preset of EXIT_STRATEGY_PRESETS) {
    const weightsMatch =
      preset.exitWeights[0] === params.exitWeights[0] &&
      preset.exitWeights[1] === params.exitWeights[1] &&
      preset.exitWeights[2] === params.exitWeights[2]
    const breakevenMatch =
      preset.moveSlToBreakevenAfterTp1 === params.moveSlToBreakevenAfterTp1
    if (weightsMatch && breakevenMatch) return preset.id
  }
  return "custom"
}

function nearestLeverage(value: number): number {
  return LEVERAGE_OPTIONS.reduce((closest, option) =>
    Math.abs(option - value) < Math.abs(closest - value) ? option : closest,
  )
}

export function VipHistoryParamsPanel({
  params,
  onChange,
  onRecompute,
  recomputing,
}: VipHistoryParamsPanelProps) {
  const [presetId, setPresetId] = useState<ExitStrategyPresetId | "custom">(
    detectPresetId(params),
  )
  const [riskPresetId, setRiskPresetId] = useState(
    detectMaxRiskPresetId(params.maxRiskPctOfMargin),
  )

  useEffect(() => {
    setPresetId(detectPresetId(params))
    setRiskPresetId(detectMaxRiskPresetId(params.maxRiskPctOfMargin))
  }, [params])

  function applyPreset(id: ExitStrategyPresetId) {
    const preset = EXIT_STRATEGY_PRESETS.find((item) => item.id === id)
    if (!preset) return

    setPresetId(id)
    onChange({
      ...params,
      exitWeights: [...preset.exitWeights],
      moveSlToBreakevenAfterTp1: preset.moveSlToBreakevenAfterTp1,
    })
  }

  function applyRiskPreset(id: string) {
    const preset = MAX_RISK_PRESETS.find((item) => item.id === id)
    if (!preset) return

    setRiskPresetId(id)
    onChange({
      ...params,
      maxRiskPctOfMargin: preset.maxRiskPctOfMargin,
    })
  }

  const activeRiskPreset = MAX_RISK_PRESETS.find((item) => item.id === riskPresetId)

  return (
    <div className="flex flex-col gap-3 border border-border bg-background/40 p-3">
      <div>
        <p className="text-xs font-medium">Simulation parameters</p>
        <p className="text-[11px] text-muted-foreground">
          Franco recommends ~x5. Use risk presets to simulate professional sizing.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1">
          <Label htmlFor="vip-margin" className="text-xs">
            Margin (USDT)
          </Label>
          <Input
            id="vip-margin"
            type="number"
            min={1}
            value={params.marginUsdt}
            onChange={(event) =>
              onChange({
                ...params,
                marginUsdt: Number.parseFloat(event.target.value) || 1000,
              })
            }
            className="h-8 font-mono text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="vip-leverage" className="text-xs">
            Leverage
          </Label>
          <select
            id="vip-leverage"
            className="h-8 w-full border border-border bg-background px-2 font-mono text-xs"
            value={nearestLeverage(params.leverage)}
            onChange={(event) =>
              onChange({
                ...params,
                leverage: Number.parseInt(event.target.value, 10),
              })
            }
          >
            {LEVERAGE_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value}x
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="vip-hours" className="text-xs">
            Observation (hours)
          </Label>
          <Input
            id="vip-hours"
            type="number"
            min={1}
            max={168}
            value={params.observationHours}
            onChange={(event) =>
              onChange({
                ...params,
                observationHours: Number.parseFloat(event.target.value) || 24,
              })
            }
            className="h-8 font-mono text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="vip-preset" className="text-xs">
            Exit strategy
          </Label>
          <select
            id="vip-preset"
            className="h-8 w-full border border-border bg-background px-2 font-mono text-xs"
            value={presetId}
            onChange={(event) => {
              const value = event.target.value
              if (value === "custom") {
                setPresetId("custom")
                return
              }
              applyPreset(value as ExitStrategyPresetId)
            }}
          >
            {EXIT_STRATEGY_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
            <option value="custom">Custom</option>
          </select>
        </div>
      </div>

      <div className="grid gap-2 border-t border-border/60 pt-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="vip-risk-preset" className="text-xs">
            Max risk per trade
          </Label>
          <select
            id="vip-risk-preset"
            className="h-8 w-full border border-border bg-background px-2 font-mono text-xs"
            value={riskPresetId}
            onChange={(event) => applyRiskPreset(event.target.value)}
          >
            {MAX_RISK_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </select>
          {activeRiskPreset && (
            <p className="text-[11px] text-muted-foreground">
              {activeRiskPreset.description}
            </p>
          )}
        </div>
        <div className="flex flex-col justify-end gap-2 text-xs">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={params.skipHighRiskSignals}
              disabled={params.maxRiskPctOfMargin === null}
              onChange={(event) =>
                onChange({ ...params, skipHighRiskSignals: event.target.checked })
              }
            />
            Skip signals above max risk (only trade low-risk setups)
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={params.capLossAtMargin}
              onChange={(event) =>
                onChange({ ...params, capLossAtMargin: event.target.checked })
              }
            />
            Cap loss at margin (liquidation model)
          </label>
        </div>
        <div className="space-y-1">
          <Label htmlFor="vip-timeout" className="text-xs">
            Timeout treatment
          </Label>
          <select
            id="vip-timeout"
            className="h-8 w-full border border-border bg-background px-2 font-mono text-xs"
            value={params.timeoutTreatment}
            onChange={(event) =>
              onChange({
                ...params,
                timeoutTreatment: event.target.value as BacktestParams["timeoutTreatment"],
              })
            }
          >
            <option value="market_close">Close at market (24h)</option>
            <option value="inconclusive">Inconclusive (0 PnL on remainder)</option>
          </select>
        </div>
        <label className="flex items-center gap-2 self-end text-xs">
          <input
            type="checkbox"
            checked={params.excludeTimeoutsFromStats}
            onChange={(event) =>
              onChange({ ...params, excludeTimeoutsFromStats: event.target.checked })
            }
          />
          Exclude timeouts from win rate / PnL
        </label>
      </div>

      <Button
        type="button"
        size="sm"
        className="w-fit"
        disabled={recomputing}
        onClick={onRecompute}
      >
        {recomputing ? "Recalculating…" : "Recalculate stats"}
      </Button>
    </div>
  )
}

export function defaultParamsFromReport(
  reportParams: Partial<BacktestParams> | undefined,
): BacktestParams {
  return {
    ...DEFAULT_BACKTEST_PARAMS,
    ...reportParams,
    leverage: nearestLeverage(reportParams?.leverage ?? DEFAULT_BACKTEST_PARAMS.leverage),
    exitWeights: reportParams?.exitWeights ?? DEFAULT_BACKTEST_PARAMS.exitWeights,
    moveSlToBreakevenAfterTp1:
      reportParams?.moveSlToBreakevenAfterTp1 ??
      DEFAULT_BACKTEST_PARAMS.moveSlToBreakevenAfterTp1,
    capLossAtMargin:
      reportParams?.capLossAtMargin ?? DEFAULT_BACKTEST_PARAMS.capLossAtMargin,
    maxRiskPctOfMargin:
      reportParams?.maxRiskPctOfMargin ?? DEFAULT_BACKTEST_PARAMS.maxRiskPctOfMargin,
    skipHighRiskSignals:
      reportParams?.skipHighRiskSignals ?? DEFAULT_BACKTEST_PARAMS.skipHighRiskSignals,
    timeoutTreatment:
      reportParams?.timeoutTreatment ?? DEFAULT_BACKTEST_PARAMS.timeoutTreatment,
    excludeTimeoutsFromStats:
      reportParams?.excludeTimeoutsFromStats ??
      DEFAULT_BACKTEST_PARAMS.excludeTimeoutsFromStats,
  }
}
