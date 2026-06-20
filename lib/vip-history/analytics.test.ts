import { describe, expect, test } from "bun:test"

import { derivePriceFormatFromLevels, formatLevelLabel } from "@/lib/chart/price-format"
import { buildVipHistoryAnalytics } from "@/lib/vip-history/analytics"
import type { BacktestResult } from "@/lib/vip-history/types"

describe("price-format", () => {
  test("uses high precision for sub-dollar levels", () => {
    const format = derivePriceFormatFromLevels([0.01969, 0.01951, 0.02001])
    expect(format.precision).toBeGreaterThanOrEqual(5)
    expect(formatLevelLabel(0.01951, format)).toBe("0.01951")
    expect(formatLevelLabel(0.01969, format)).not.toBe(formatLevelLabel(0.01951, format))
  })
})

describe("analytics", () => {
  test("builds direction and sl distance buckets", () => {
    const results = [
      {
        signal: {
          id: 1,
          parsed: {
            pair: "FOGO/USDT",
            direction: "SHORT",
            entry: 0.01969,
            stopLoss: 0.02001,
            tp1: 0.01951,
            tp2: 0.01936,
            tp3: 0.01915,
            entryIsRange: false,
            warnings: [],
          },
        },
        outcome: "loss",
        entryPrice: 0.01969,
        entryTime: 1_700_000_000,
        totalPnlUsdt: -80,
        totalRoiPct: -8,
        exits: [],
        tp1Hit: false,
        tp2Hit: false,
        tp3Hit: false,
      },
    ] as BacktestResult[]

    const analytics = buildVipHistoryAnalytics(results)
    expect(analytics.byDirection).toHaveLength(2)
    expect(analytics.slDistanceBuckets.some((bucket) => bucket.count > 0)).toBe(true)
  })
})
