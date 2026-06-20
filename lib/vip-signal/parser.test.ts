import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { parseVipSignal, parsedVipToPartialSetup } from "./parser"

const ejemplos = readFileSync(join(import.meta.dir, "../../ejemplos.txt"), "utf-8")

describe("parseVipSignal integration", () => {
  test("parses all signals in ejemplos.txt", () => {
    const signals = ejemplos.split(/(?=SEÑAL VIP)/).filter((s) => s.trim())
    expect(signals.length).toBe(9)

    for (const signal of signals) {
      const parsed = parseVipSignal(signal)
      expect(parsed).not.toBeNull()
      expect(parsed?.pair).toMatch(/\/USDT$/)
      expect(parsed?.entry).toBeGreaterThan(0)
      expect(parsed?.stopLoss).toBeGreaterThan(0)
    }
  })

  test("BNB range signal uses minimum entry 599", () => {
    const signals = ejemplos.split(/(?=SEÑAL VIP)/).filter((s) => s.trim())
    const bnbRange = signals.find((s) => s.includes("599 – 600"))
    expect(bnbRange).toBeDefined()

    const parsed = parseVipSignal(bnbRange!)
    expect(parsed?.entry).toBe(599)
    expect(parsed?.entryMin).toBe(599)
    expect(parsed?.entryMax).toBe(600)
  })

  test("parsedVipToPartialSetup strips journal-only fields", () => {
    const parsed = parseVipSignal(signalsFromEjemplos()[0])
    expect(parsed).not.toBeNull()

    const partial = parsedVipToPartialSetup(parsed!)
    expect(partial).toEqual({
      pair: "BNB/USDT",
      direction: "SHORT",
      entry: 580.55,
      stopLoss: 582.2,
      tp1: 577.2,
      tp2: 573.1,
      tp3: 570,
    })
    expect("marginUsdt" in partial).toBe(false)
  })

  test("parses $SUI/USDT asset format", () => {
    const text = `SEÑAL VIP

$SUI/USDT - LARGO 📈

Plan de Comercio:
• Entrada: 1.0091 – 1.0123
• Stop Loss: 0.9956

Take Profits:
• TP1: 1.0220
• TP2: 1.0296
• TP3: 1.0409`

    const parsed = parseVipSignal(text)
    expect(parsed).not.toBeNull()
    expect(parsed?.pair).toBe("SUI/USDT")
    expect(parsed?.direction).toBe("LONG")
    expect(parsed?.entryMin).toBe(1.0091)
    expect(parsed?.entryMax).toBe(1.0123)
  })

  test("parses Zona de Entrada label", () => {
    const text = `SEÑAL VIP

$DYDX - LARGO 📈

Plan de Comercio:
• Zona de Entrada: 0.135 – 0.139
• Stop Loss: 0.128

Take Profits:
• TP1: 0.145
• TP2: 0.152
• TP3: 0.160`

    const parsed = parseVipSignal(text)
    expect(parsed).not.toBeNull()
    expect(parsed?.pair).toBe("DYDX/USDT")
    expect(parsed?.entryMin).toBe(0.135)
    expect(parsed?.entryMax).toBe(0.139)
    expect(parsed?.entry).toBe(0.135)
  })

  test("parses single entry with (zona actual) suffix", () => {
    const text = `SEÑAL VIP

$ETH - CORTO 📉

Plan de Comercio:
• Entrada: 2350 (zona actual)
• Stop Loss: 2440

Take Profits:
• TP1: 2310
• TP2: 2280
• TP3: 2220`

    const parsed = parseVipSignal(text)
    expect(parsed).not.toBeNull()
    expect(parsed?.pair).toBe("ETH/USDT")
    expect(parsed?.direction).toBe("SHORT")
    expect(parsed?.entry).toBe(2350)
    expect(parsed?.entryIsRange).toBe(false)
    expect(parsed?.stopLoss).toBe(2440)
    expect(parsed?.tp1).toBe(2310)
  })
})

function signalsFromEjemplos(): string[] {
  return ejemplos.split(/(?=SEÑAL VIP)/).filter((s) => s.trim())
}
