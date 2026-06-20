import { describe, expect, test } from "bun:test"

import type { MarketCandle } from "@/lib/market/types"
import type { ParsedVipSignal } from "@/lib/signal-risk/types"

import {
  DEFAULT_BACKTEST_PARAMS,
  simulateVipSignal,
} from "./simulator"
import type { HistoricalSignal } from "./types"

function makeSignal(
  parsed: ParsedVipSignal,
  signalTimeMs = 1_700_000_000_000,
): HistoricalSignal {
  return {
    id: 1,
    date: "2024-01-01T00:00:00",
    signalTime: signalTimeMs,
    rawText: "SEÑAL VIP",
    parsed,
  }
}

function candle(
  timeSec: number,
  open: number,
  high: number,
  low: number,
  close: number,
): MarketCandle {
  return { time: timeSec, open, high, low, close }
}

const longSetup: ParsedVipSignal = {
  pair: "BTC/USDT",
  direction: "LONG",
  entry: 100,
  entryMin: 100,
  entryMax: 102,
  entryIsRange: true,
  stopLoss: 95,
  tp1: 105,
  tp2: 110,
  tp3: 115,
  warnings: [],
}

const shortSetup: ParsedVipSignal = {
  pair: "ETH/USDT",
  direction: "SHORT",
  entry: 200,
  entryIsRange: false,
  stopLoss: 210,
  tp1: 190,
  tp2: 180,
  tp3: 170,
  warnings: [],
}

describe("simulateVipSignal", () => {
  test("returns not_executed when price never enters range", () => {
    const base = 1_700_000_000
    const result = simulateVipSignal({
      signal: makeSignal(longSetup, base * 1000),
      params: DEFAULT_BACKTEST_PARAMS,
      candles: [
        candle(base, 120, 121, 119, 120),
        candle(base + 60, 120, 121, 119, 120),
      ],
    })

    expect(result.outcome).toBe("not_executed")
    expect(result.exits).toHaveLength(0)
  })

  test("hits stop loss before take profit on same candle (conservative)", () => {
    const base = 1_700_000_100
    const result = simulateVipSignal({
      signal: makeSignal(longSetup, base * 1000),
      params: DEFAULT_BACKTEST_PARAMS,
      candles: [
        candle(base, 101, 102, 100, 101),
        candle(base + 60, 101, 106, 94, 95),
      ],
    })

    expect(result.outcome).toBe("loss")
    expect(result.tp1Hit).toBe(false)
    expect(result.totalPnlUsdt).toBeLessThan(0)
    expect(result.exits.some((event) => event.type === "sl")).toBe(true)
  })

  test("TP1 then breakeven stop on remainder", () => {
    const base = 1_700_000_200
    const result = simulateVipSignal({
      signal: makeSignal(longSetup, base * 1000),
      params: DEFAULT_BACKTEST_PARAMS,
      candles: [
        candle(base, 101, 102, 100, 101),
        candle(base + 60, 102, 106, 101, 105),
        candle(base + 120, 104, 104, 101, 102),
      ],
    })

    expect(result.tp1Hit).toBe(true)
    expect(result.tp2Hit).toBe(false)
    expect(result.outcome).toBe("partial_win")
    expect(result.totalPnlUsdt).toBeGreaterThan(0)
  })

  test("full TP chain closes entire position", () => {
    const base = 1_700_000_300
    const result = simulateVipSignal({
      signal: makeSignal(longSetup, base * 1000),
      params: DEFAULT_BACKTEST_PARAMS,
      candles: [
        candle(base, 101, 102, 100, 101),
        candle(base + 60, 102, 106, 101, 105),
        candle(base + 120, 105, 111, 104, 110),
        candle(base + 180, 110, 116, 109, 115),
      ],
    })

    expect(result.outcome).toBe("full_win")
    expect(result.tp1Hit).toBe(true)
    expect(result.tp2Hit).toBe(true)
    expect(result.tp3Hit).toBe(true)
    expect(result.totalPnlUsdt).toBeGreaterThan(0)
  })

  test("timeout closes remaining weight at last close", () => {
    const base = 1_700_000_400
    const result = simulateVipSignal({
      signal: makeSignal(shortSetup, base * 1000),
      params: { ...DEFAULT_BACKTEST_PARAMS, observationHours: 1 },
      candles: [
        candle(base, 200, 201, 199, 200),
        candle(base + 60, 199, 200, 198, 199),
        candle(base + 120, 198, 199, 197, 198),
      ],
    })

    expect(result.outcome).toBe("timeout")
    expect(result.exits.some((event) => event.type === "timeout_close")).toBe(true)
  })

  test("100% at TP1 closes entire position without breakeven stop", () => {
    const base = 1_700_000_500
    const result = simulateVipSignal({
      signal: makeSignal(longSetup, base * 1000),
      params: {
        ...DEFAULT_BACKTEST_PARAMS,
        exitWeights: [1, 0, 0],
        moveSlToBreakevenAfterTp1: false,
      },
      candles: [
        candle(base, 101, 102, 100, 101),
        candle(base + 60, 102, 106, 101, 105),
        candle(base + 120, 104, 101, 100, 101),
      ],
    })

    expect(result.outcome).toBe("partial_win")
    expect(result.tp1Hit).toBe(true)
    expect(result.exits.filter((event) => event.type === "tp1")).toHaveLength(1)
    expect(result.exits.some((event) => event.type === "sl")).toBe(false)
  })

  test("returns no_data for empty candles", () => {
    const result = simulateVipSignal({
      signal: makeSignal(longSetup),
      params: DEFAULT_BACKTEST_PARAMS,
      candles: [],
    })

    expect(result.outcome).toBe("no_data")
  })
})
