import { readFileSync } from "node:fs"

import type { MarketSymbol } from "@/lib/market/types"
import { toBinanceSymbol } from "@/lib/market/symbols"
import { parseVipSignal } from "@/lib/vip-signal/parser"

import type {
  HistoricalSignal,
  SkippedSignal,
  TelegramExport,
  TelegramExportMessage,
} from "./types"

const VIP_MARKER = "SEÑAL VIP"

export function buildListedSymbolSet(symbols: MarketSymbol[]): Set<string> {
  return new Set(symbols.map((item) => item.symbol))
}

export function isPairListed(
  listedSymbols: Set<string>,
  pair: string,
): boolean {
  return listedSymbols.has(toBinanceSymbol(pair))
}

export function extractFullText(message: TelegramExportMessage): string {
  if (typeof message.full_text === "string" && message.full_text.trim()) {
    return message.full_text
  }
  if (typeof message.text === "string") {
    return message.text
  }
  return ""
}

export function isVipSignalMessage(message: TelegramExportMessage): boolean {
  if (message.type !== "message") return false
  return extractFullText(message).includes(VIP_MARKER)
}

export function parseTelegramExport(raw: string): TelegramExport {
  return JSON.parse(raw) as TelegramExport
}

export function loadTelegramExportFromFile(path: string): TelegramExport {
  const content = readFileSync(path, "utf-8")
  return parseTelegramExport(content)
}

export interface ImportVipSignalsResult {
  signals: HistoricalSignal[]
  skipped: SkippedSignal[]
}

export function importVipSignalsFromExport(
  exportData: TelegramExport,
  listedSymbols: Set<string>,
): ImportVipSignalsResult {
  const signals: HistoricalSignal[] = []
  const skipped: SkippedSignal[] = []

  for (const message of exportData.messages) {
    if (!isVipSignalMessage(message)) continue

    const rawText = extractFullText(message)
    const signalTime = Number.parseInt(message.date_unixtime, 10) * 1000
    const parsed = parseVipSignal(rawText)

    if (!parsed) {
      skipped.push({
        id: message.id,
        date: message.date,
        signalTime,
        rawText,
        reason: "parse_failed",
      })
      continue
    }

    if (!isPairListed(listedSymbols, parsed.pair)) {
      skipped.push({
        id: message.id,
        date: message.date,
        signalTime,
        rawText,
        reason: "symbol_not_listed",
      })
      continue
    }

    signals.push({
      id: message.id,
      date: message.date,
      signalTime,
      rawText,
      parsed,
    })
  }

  return { signals, skipped }
}

export function importVipSignalsFromFile(
  path: string,
  listedSymbols: Set<string>,
): ImportVipSignalsResult {
  const exportData = loadTelegramExportFromFile(path)
  return importVipSignalsFromExport(exportData, listedSymbols)
}
