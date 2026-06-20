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
})

function signalsFromEjemplos(): string[] {
  return ejemplos.split(/(?=SEÑAL VIP)/).filter((s) => s.trim())
}
