import { priceMovePct } from "@/lib/signal-risk/calculator"
import { DEFAULT_BACKTEST_PARAMS } from "@/lib/vip-history/params"
import type { TradeDirection } from "@/lib/signal-risk/types"
import type { MarketCandle } from "@/lib/market/types"

import type {
  BacktestParams,
  BacktestResult,
  ExitEvent,
  SignalOutcome,
  SimulateInput,
  TimeoutTreatment,
} from "./types"

const PNL_EPSILON = 0.01

function candleOpenMs(candle: MarketCandle): number {
  return candle.time * 1000
}

function isPriceInRange(
  candle: MarketCandle,
  min: number,
  max: number,
): boolean {
  return candle.low <= max && candle.high >= min
}

function resolveFillPrice(
  parsed: SimulateInput["signal"]["parsed"],
): number {
  if (parsed.entryIsRange && parsed.entryMin !== undefined && parsed.entryMax !== undefined) {
    return parsed.direction === "LONG" ? parsed.entryMax : parsed.entryMin
  }
  return parsed.entry
}

function resolveEntryBounds(parsed: SimulateInput["signal"]["parsed"]): {
  min: number
  max: number
} {
  if (parsed.entryIsRange && parsed.entryMin !== undefined && parsed.entryMax !== undefined) {
    return { min: parsed.entryMin, max: parsed.entryMax }
  }
  return { min: parsed.entry, max: parsed.entry }
}

function isStopHit(
  candle: MarketCandle,
  stopLoss: number,
  direction: TradeDirection,
): boolean {
  if (direction === "LONG") {
    return candle.low <= stopLoss
  }
  return candle.high >= stopLoss
}

function isTakeProfitHit(
  candle: MarketCandle,
  tpPrice: number,
  direction: TradeDirection,
): boolean {
  if (direction === "LONG") {
    return candle.high >= tpPrice
  }
  return candle.low <= tpPrice
}

function weightedPnlUsdt(
  entryPrice: number,
  exitPrice: number,
  direction: TradeDirection,
  weight: number,
  notional: number,
): number {
  const movePct = priceMovePct(entryPrice, exitPrice, direction)
  return notional * weight * (movePct / 100)
}

function resolveSizeMultiplier(
  entryPrice: number,
  stopLoss: number,
  direction: TradeDirection,
  params: BacktestParams,
): number {
  if (params.maxRiskPctOfMargin === null) return 1

  const slMovePct = Math.abs(priceMovePct(entryPrice, stopLoss, direction))
  if (slMovePct <= 0) return 1

  const riskAtFullSize = slMovePct * params.leverage
  if (riskAtFullSize <= params.maxRiskPctOfMargin) return 1
  return params.maxRiskPctOfMargin / riskAtFullSize
}

function capLossUsdt(
  pnlUsdt: number,
  remainingWeight: number,
  params: BacktestParams,
  sizeMultiplier: number,
): number {
  if (!params.capLossAtMargin || pnlUsdt >= 0) return pnlUsdt
  const maxLoss = params.marginUsdt * remainingWeight * sizeMultiplier
  return Math.max(pnlUsdt, -maxLoss)
}

function classifyOutcome(
  totalPnlUsdt: number,
  tp1Hit: boolean,
  tp2Hit: boolean,
  tp3Hit: boolean,
  timedOut: boolean,
  executed: boolean,
  timeoutTreatment: TimeoutTreatment,
): SignalOutcome {
  if (!executed) return "not_executed"

  if (tp3Hit) return "full_win"

  if (timedOut && timeoutTreatment === "inconclusive" && !tp1Hit && !tp2Hit) {
    return "inconclusive"
  }

  if (timedOut && timeoutTreatment === "market_close") return "timeout"

  if (timedOut && timeoutTreatment === "inconclusive") {
    if (totalPnlUsdt > PNL_EPSILON) return "partial_win"
    return "inconclusive"
  }

  if (tp1Hit && !tp2Hit && !tp3Hit && Math.abs(totalPnlUsdt) <= PNL_EPSILON) {
    return "breakeven"
  }

  if ((tp1Hit || tp2Hit) && !tp3Hit && totalPnlUsdt > PNL_EPSILON) {
    return "partial_win"
  }

  if (totalPnlUsdt < -PNL_EPSILON) return "loss"
  if (totalPnlUsdt > PNL_EPSILON) return "win"
  return "breakeven"
}

export function simulateVipSignal(input: SimulateInput): BacktestResult {
  const { signal, candles, params } = input
  const { parsed } = signal
  const notional = params.marginUsdt * params.leverage
  const observationEnd =
    signal.signalTime + params.observationHours * 60 * 60 * 1000

  if (candles.length === 0) {
    return {
      signal,
      outcome: "no_data",
      totalPnlUsdt: 0,
      totalRoiPct: 0,
      exits: [],
      tp1Hit: false,
      tp2Hit: false,
      tp3Hit: false,
    }
  }

  const windowCandles = candles.filter((candle) => {
    const openMs = candleOpenMs(candle)
    return openMs >= signal.signalTime && openMs <= observationEnd
  })

  if (windowCandles.length === 0) {
    return {
      signal,
      outcome: "no_data",
      totalPnlUsdt: 0,
      totalRoiPct: 0,
      exits: [],
      tp1Hit: false,
      tp2Hit: false,
      tp3Hit: false,
    }
  }

  const bounds = resolveEntryBounds(parsed)
  let entryIndex = -1
  let entryPrice = 0

  for (let index = 0; index < windowCandles.length; index += 1) {
    const candle = windowCandles[index]!
    if (isPriceInRange(candle, bounds.min, bounds.max)) {
      entryIndex = index
      entryPrice = resolveFillPrice(parsed)
      break
    }
  }

  if (entryIndex < 0) {
    return {
      signal,
      outcome: "not_executed",
      totalPnlUsdt: 0,
      totalRoiPct: 0,
      exits: [],
      tp1Hit: false,
      tp2Hit: false,
      tp3Hit: false,
    }
  }

  const entryCandle = windowCandles[entryIndex]!
  const sizeMultiplier = resolveSizeMultiplier(
    entryPrice,
    parsed.stopLoss,
    parsed.direction,
    params,
  )

  if (
    params.skipHighRiskSignals &&
    params.maxRiskPctOfMargin !== null &&
    sizeMultiplier < 1
  ) {
    return {
      signal,
      outcome: "risk_filtered",
      entryPrice,
      entryTime: entryCandle.time,
      totalPnlUsdt: 0,
      totalRoiPct: 0,
      exits: [
        {
          type: "entry",
          time: entryCandle.time,
          price: entryPrice,
          weight: 1,
          pnlUsdt: 0,
        },
      ],
      tp1Hit: false,
      tp2Hit: false,
      tp3Hit: false,
    }
  }

  const effectiveNotional = notional * sizeMultiplier
  const exits: ExitEvent[] = [
    {
      type: "entry",
      time: entryCandle.time,
      price: entryPrice,
      weight: 1,
      pnlUsdt: 0,
    },
  ]

  let remainingWeight = 1
  let stopLoss = parsed.stopLoss
  let totalPnlUsdt = 0
  let tp1Hit = false
  let tp2Hit = false
  let tp3Hit = false
  let timedOut = false

  const tpPrices = [parsed.tp1, parsed.tp2, parsed.tp3] as const

  for (let index = entryIndex; index < windowCandles.length; index += 1) {
    const candle = windowCandles[index]!
    if (remainingWeight <= 0) break

    if (isStopHit(candle, stopLoss, parsed.direction)) {
      const rawPnl = weightedPnlUsdt(
        entryPrice,
        stopLoss,
        parsed.direction,
        remainingWeight,
        effectiveNotional,
      )
      const pnlUsdt = capLossUsdt(rawPnl, remainingWeight, params, sizeMultiplier)
      exits.push({
        type: "sl",
        time: candle.time,
        price: stopLoss,
        weight: remainingWeight,
        pnlUsdt,
      })
      totalPnlUsdt += pnlUsdt
      remainingWeight = 0
      break
    }

    for (let tpIndex = 0; tpIndex < tpPrices.length; tpIndex += 1) {
      const alreadyHit =
        tpIndex === 0 ? tp1Hit : tpIndex === 1 ? tp2Hit : tp3Hit
      if (alreadyHit) continue

      const tpPrice = tpPrices[tpIndex]!
      if (!isTakeProfitHit(candle, tpPrice, parsed.direction)) continue

      const weight = params.exitWeights[tpIndex]!
      if (weight <= 0) continue
      const pnlUsdt = weightedPnlUsdt(
        entryPrice,
        tpPrice,
        parsed.direction,
        weight,
        effectiveNotional,
      )

      const exitType =
        tpIndex === 0 ? "tp1" : tpIndex === 1 ? "tp2" : "tp3"

      exits.push({
        type: exitType,
        time: candle.time,
        price: tpPrice,
        weight,
        pnlUsdt,
      })

      totalPnlUsdt += pnlUsdt
      remainingWeight -= weight

      if (tpIndex === 0) {
        tp1Hit = true
        if (params.moveSlToBreakevenAfterTp1) {
          stopLoss = entryPrice
        }
      } else if (tpIndex === 1) {
        tp2Hit = true
      } else {
        tp3Hit = true
      }

      if (remainingWeight <= 0) {
        remainingWeight = 0
        break
      }
    }

    if (remainingWeight <= 0) break

    const isLastCandle = index === windowCandles.length - 1
    if (isLastCandle && remainingWeight > 0) {
      timedOut = true
      const closePrice =
        params.timeoutTreatment === "inconclusive" ? entryPrice : candle.close
      const rawPnl = weightedPnlUsdt(
        entryPrice,
        closePrice,
        parsed.direction,
        remainingWeight,
        effectiveNotional,
      )
      const pnlUsdt =
        params.timeoutTreatment === "inconclusive"
          ? 0
          : capLossUsdt(rawPnl, remainingWeight, params, sizeMultiplier)
      exits.push({
        type: "timeout_close",
        time: candle.time,
        price: closePrice,
        weight: remainingWeight,
        pnlUsdt,
      })
      totalPnlUsdt += pnlUsdt
      remainingWeight = 0
    }
  }

  const totalRoiPct =
    params.marginUsdt > 0 ? (totalPnlUsdt / params.marginUsdt) * 100 : 0

  const outcome = classifyOutcome(
    totalPnlUsdt,
    tp1Hit,
    tp2Hit,
    tp3Hit,
    timedOut,
    true,
    params.timeoutTreatment,
  )

  return {
    signal,
    outcome,
    entryPrice,
    entryTime: entryCandle.time,
    totalPnlUsdt,
    totalRoiPct,
    exits,
    tp1Hit,
    tp2Hit,
    tp3Hit,
  }
}

export { DEFAULT_BACKTEST_PARAMS } from "@/lib/vip-history/params"
