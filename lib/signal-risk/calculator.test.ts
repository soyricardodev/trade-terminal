import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { calculateRiskAnalysis, priceMovePct } from "./calculator"
import { parseVipSignal } from "../vip-signal/parser"

const ejemplosPath = join(import.meta.dir, "../../ejemplos.txt")
const ejemplos = readFileSync(ejemplosPath, "utf-8")
const signals = ejemplos.split(/(?=SEÑAL VIP)/).filter((s) => s.trim())

function getSignal(index: number): string {
  return signals[index]?.trim() ?? ""
}

describe("priceMovePct", () => {
  test("SHORT move toward TP is positive", () => {
    const move = priceMovePct(580.55, 577.2, "SHORT")
    expect(move).toBeCloseTo(0.5769, 3)
  })

  test("LONG move toward TP is positive", () => {
    const move = priceMovePct(1.1985, 1.21, "LONG")
    expect(move).toBeCloseTo(0.9595, 3)
  })
})

describe("calculateRiskAnalysis", () => {
  test("BNB SHORT matches expected phase outputs", () => {
    const analysis = calculateRiskAnalysis({
      pair: "BNB/USDT",
      direction: "SHORT",
      entry: 580.55,
      stopLoss: 582.2,
      tp1: 577.2,
      tp2: 573.1,
      tp3: 570,
      marginUsdt: 100,
      leverage: 10,
    })

    expect(analysis.notional).toBe(1000)
    expect(analysis.slMovePct).toBeCloseTo(0.2842, 3)
    expect(analysis.maxLossUsdt).toBeCloseTo(2.842, 2)
    expect(analysis.maxLossRoiPct).toBeCloseTo(-2.842, 2)

    expect(analysis.phases[0].priceMovePct).toBeCloseTo(0.5769, 3)
    expect(analysis.phases[0].leveragedRoiPct).toBeCloseTo(5.769, 2)
    expect(analysis.phases[0].pnlUsdt).toBeCloseTo(2.884, 2)
    expect(analysis.phases[0].rrRatio).toBeCloseTo(2.03, 1)

    expect(analysis.phases[1].pnlUsdt).toBeCloseTo(3.846, 2)
    expect(analysis.phases[2].pnlUsdt).toBeCloseTo(3.634, 2)
    expect(analysis.maxGainUsdt).toBeCloseTo(10.37, 1)
    expect(analysis.maxGainRoiPct).toBeCloseTo(10.37, 1)
  })
})

describe("parseVipSignal", () => {
  test("parses BNB SHORT single entry", () => {
    const parsed = parseVipSignal(getSignal(0))
    expect(parsed).not.toBeNull()
    expect(parsed?.pair).toBe("BNB/USDT")
    expect(parsed?.direction).toBe("SHORT")
    expect(parsed?.entry).toBe(580.55)
    expect(parsed?.stopLoss).toBe(582.2)
    expect(parsed?.tp1).toBe(577.2)
    expect(parsed?.tp2).toBe(573.1)
    expect(parsed?.tp3).toBe(570)
    expect(parsed?.warnings).toHaveLength(0)
  })

  test("parses ADA SHORT range using minimum entry", () => {
    const parsed = parseVipSignal(getSignal(1))
    expect(parsed).not.toBeNull()
    expect(parsed?.pair).toBe("ADA/USDT")
    expect(parsed?.direction).toBe("SHORT")
    expect(parsed?.entry).toBe(0.1622)
    expect(parsed?.entryMin).toBe(0.1622)
    expect(parsed?.entryMax).toBe(0.1626)
    expect(parsed?.entryIsRange).toBe(true)
    expect(parsed?.stopLoss).toBe(0.1635)
  })

  test("parses XRP LONG range using minimum entry", () => {
    const parsed = parseVipSignal(getSignal(6))
    expect(parsed).not.toBeNull()
    expect(parsed?.pair).toBe("XRP/USDT")
    expect(parsed?.direction).toBe("LONG")
    expect(parsed?.entry).toBe(1.1985)
    expect(parsed?.entryMin).toBe(1.1985)
    expect(parsed?.entryMax).toBe(1.199)
    expect(parsed?.stopLoss).toBe(1.188)
    expect(parsed?.tp3).toBe(1.22)
  })

  test("warns when invalidation SL differs from plan (SUI)", () => {
    const parsed = parseVipSignal(getSignal(3))
    expect(parsed).not.toBeNull()
    expect(parsed?.stopLoss).toBe(0.73)
    expect(parsed?.warnings.length).toBeGreaterThan(0)
    expect(parsed?.warnings[0]).toContain("0.733")
  })

  test("warns when invalidation SL differs from plan (ENA)", () => {
    const parsed = parseVipSignal(getSignal(8))
    expect(parsed).not.toBeNull()
    expect(parsed?.stopLoss).toBe(0.0895)
    expect(parsed?.warnings.length).toBeGreaterThan(0)
    expect(parsed?.warnings[0]).toContain("0.0892")
  })
})
