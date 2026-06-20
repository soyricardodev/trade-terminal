const BINANCE_SYMBOL_RE = /^[A-Z0-9]+USDT$/

export function toBinanceSymbol(display: string): string {
  return display.replace(/\//g, "").replace(/\s/g, "").toUpperCase()
}

export function toDisplaySymbol(symbol: string): string {
  const upper = symbol.toUpperCase()
  if (upper.endsWith("USDT")) {
    return `${upper.slice(0, -4)}/USDT`
  }
  return upper
}

export function isValidBinanceSymbol(symbol: string): boolean {
  return BINANCE_SYMBOL_RE.test(symbol)
}

export function isValidDisplayPair(display: string): boolean {
  const symbol = toBinanceSymbol(display)
  return isValidBinanceSymbol(symbol)
}
