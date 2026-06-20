import type { ParsedVipSignal, TradeDirection } from "@/lib/signal-risk/types"

const ASSET_PATTERN = /\$([A-Z0-9]+)\s*-\s*(CORTO|LONG)/i
const PLAN_SECTION_PATTERN = /Plan de Comercio:\s*([\s\S]*?)(?=Take Profits:|Justificación:|$)/i
const ENTRY_PATTERN =
  /Entrada:\s*([\d.]+)\s*(?:[–\-]\s*([\d.]+))?(?:\s*\([^)]*\))?/i
const STOP_LOSS_PATTERN = /Stop Loss:\s*([\d.]+)/i
const TP_PATTERN = /TP(\d):\s*([\d.]+)/gi
const INVALIDATION_PATTERN =
  /⚠️\s*Mientras el precio permanezca\s+(?:por\s+)?(?:debajo|por encima)\s+de\s+([\d.]+)/i

function parseDirection(raw: string): TradeDirection {
  return raw.toUpperCase() === "LONG" ? "LONG" : "SHORT"
}

function parseNumber(value: string): number {
  return Number.parseFloat(value)
}

function extractPlanSection(text: string): string | null {
  const match = text.match(PLAN_SECTION_PATTERN)
  return match?.[1]?.trim() ?? null
}

function extractInvalidationPrice(text: string): number | null {
  const match = text.match(INVALIDATION_PATTERN)
  return match?.[1] ? parseNumber(match[1]) : null
}

function pricesDiffer(a: number, b: number, tolerance = 0.0001): boolean {
  return Math.abs(a - b) > tolerance
}

export function parseVipSignal(text: string): ParsedVipSignal | null {
  const trimmed = text.trim()
  if (!trimmed) return null

  const assetMatch = trimmed.match(ASSET_PATTERN)
  if (!assetMatch) return null

  const symbol = assetMatch[1].toUpperCase()
  const direction = parseDirection(assetMatch[2])
  const pair = `${symbol}/USDT`

  const planSection = extractPlanSection(trimmed)
  if (!planSection) return null

  const entryMatch = planSection.match(ENTRY_PATTERN)
  if (!entryMatch) return null

  const entryMin = parseNumber(entryMatch[1])
  const entryMax = entryMatch[2] ? parseNumber(entryMatch[2]) : undefined
  const entryIsRange = entryMax !== undefined
  const entry = entryIsRange ? Math.min(entryMin, entryMax) : entryMin

  const stopLossMatch = planSection.match(STOP_LOSS_PATTERN)
  if (!stopLossMatch) return null
  const stopLoss = parseNumber(stopLossMatch[1])

  const takeProfitsSection =
    trimmed.match(/Take Profits:\s*([\s\S]*?)(?=Justificación:|Sesgo:|$)/i)?.[1] ??
    trimmed

  const tps: Record<number, number> = {}
  for (const match of takeProfitsSection.matchAll(TP_PATTERN)) {
    tps[Number.parseInt(match[1], 10)] = parseNumber(match[2])
  }

  if (!tps[1] || !tps[2] || !tps[3]) return null

  const warnings: string[] = []
  const invalidationPrice = extractInvalidationPrice(trimmed)
  if (invalidationPrice !== null && pricesDiffer(invalidationPrice, stopLoss)) {
    warnings.push(
      `Invalidation text mentions ${invalidationPrice}, but Plan de Comercio Stop Loss is ${stopLoss}. Using plan value.`,
    )
  }

  return {
    pair,
    direction,
    entry,
    entryMin: entryIsRange ? Math.min(entryMin, entryMax!) : undefined,
    entryMax: entryIsRange ? Math.max(entryMin, entryMax!) : undefined,
    entryIsRange,
    stopLoss,
    tp1: tps[1],
    tp2: tps[2],
    tp3: tps[3],
    warnings,
  }
}

export function parsedVipToPartialSetup(
  parsed: ParsedVipSignal,
): Omit<
  import("@/lib/signal-risk/types").TradeSetup,
  "marginUsdt" | "leverage"
> {
  return {
    pair: parsed.pair,
    direction: parsed.direction,
    entry: parsed.entry,
    stopLoss: parsed.stopLoss,
    tp1: parsed.tp1,
    tp2: parsed.tp2,
    tp3: parsed.tp3,
  }
}
