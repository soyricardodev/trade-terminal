import { describe, expect, test } from "bun:test"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

import {
  buildListedSymbolSet,
  importVipSignalsFromExport,
  isVipSignalMessage,
  parseTelegramExport,
} from "./telegram-import"

const RESULT_JSON = join(import.meta.dir, "../../result.json")

function loadResultExport() {
  if (!existsSync(RESULT_JSON)) {
    return null
  }
  return parseTelegramExport(readFileSync(RESULT_JSON, "utf-8"))
}

describe("telegram-import", () => {
  test("isVipSignalMessage filters non-VIP messages", () => {
    expect(
      isVipSignalMessage({
        id: 1,
        type: "message",
        date: "2026-01-01",
        date_unixtime: "1735689600",
        full_text: "SEÑAL VIP\n\n$BNB - LONG",
      }),
    ).toBe(true)

    expect(
      isVipSignalMessage({
        id: 2,
        type: "service",
        date: "2026-01-01",
        date_unixtime: "1735689600",
        full_text: "SEÑAL VIP",
      }),
    ).toBe(false)

    expect(
      isVipSignalMessage({
        id: 3,
        type: "message",
        date: "2026-01-01",
        date_unixtime: "1735689600",
        full_text: "Educational update only",
      }),
    ).toBe(false)
  })

  test("importVipSignalsFromExport parses sample messages", () => {
    const listed = buildListedSymbolSet([
      { symbol: "SUIUSDT", display: "SUI/USDT", baseAsset: "SUI", quoteAsset: "USDT" },
      { symbol: "DYDXUSDT", display: "DYDX/USDT", baseAsset: "DYDX", quoteAsset: "USDT" },
      { symbol: "ETHUSDT", display: "ETH/USDT", baseAsset: "ETH", quoteAsset: "USDT" },
      { symbol: "FOGOUSDT", display: "FOGO/USDT", baseAsset: "FOGO", quoteAsset: "USDT" },
    ])

    const { signals, skipped } = importVipSignalsFromExport(
      {
        messages: [
          {
            id: 100,
            type: "message",
            date: "2026-05-01T12:00:00",
            date_unixtime: "1777636800",
            full_text: `SEÑAL VIP

$SUI/USDT - LARGO 📈

Plan de Comercio:
• Entrada: 1.0091 – 1.0123
• Stop Loss: 0.9956

Take Profits:
• TP1: 1.0220
• TP2: 1.0296
• TP3: 1.0409`,
          },
          {
            id: 101,
            type: "message",
            date: "2026-05-02T12:00:00",
            date_unixtime: "1777723200",
            full_text: `SEÑAL VIP

$DYDX - LARGO 📈

Plan de Comercio:
• Zona de Entrada: 0.135 – 0.139
• Stop Loss: 0.128

Take Profits:
• TP1: 0.145
• TP2: 0.152
• TP3: 0.160`,
          },
          {
            id: 102,
            type: "message",
            date: "2026-05-03T12:00:00",
            date_unixtime: "1777809600",
            full_text: "SEÑAL VIP\n\nBroken signal without plan",
          },
          {
            id: 103,
            type: "message",
            date: "2026-05-04T12:00:00",
            date_unixtime: "1777896000",
            full_text: `SEÑAL VIP

$XNY - LARGO 📈

Plan de Comercio:
• Entrada: 0.00593 – 0.00597
• Stop Loss: 0.00580

Take Profits:
• TP1: 0.00608
• TP2: 0.00615
• TP3: 0.00625`,
          },
        ],
      },
      listed,
    )

    expect(signals).toHaveLength(2)
    expect(signals[0]?.parsed.pair).toBe("SUI/USDT")
    expect(signals[1]?.parsed.entryMin).toBe(0.135)

    expect(skipped).toHaveLength(2)
    expect(skipped.find((item) => item.reason === "parse_failed")).toBeDefined()
    expect(skipped.find((item) => item.reason === "symbol_not_listed")).toBeDefined()
  })

  test("imports real result.json when present", () => {
    const exportData = loadResultExport()
    if (!exportData) return

    const vipCount = exportData.messages.filter(isVipSignalMessage).length
    expect(vipCount).toBeGreaterThan(50)

    const listed = buildListedSymbolSet([
      { symbol: "BTCUSDT", display: "BTC/USDT", baseAsset: "BTC", quoteAsset: "USDT" },
      { symbol: "ETHUSDT", display: "ETH/USDT", baseAsset: "ETH", quoteAsset: "USDT" },
      { symbol: "SUIUSDT", display: "SUI/USDT", baseAsset: "SUI", quoteAsset: "USDT" },
      { symbol: "BNBUSDT", display: "BNB/USDT", baseAsset: "BNB", quoteAsset: "USDT" },
    ])

    const { signals, skipped } = importVipSignalsFromExport(exportData, listed)
    expect(signals.length + skipped.length).toBe(vipCount)
    expect(signals.some((item) => item.parsed.pair === "SUI/USDT")).toBe(true)
  })
})
