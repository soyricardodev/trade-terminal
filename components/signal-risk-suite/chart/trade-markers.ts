import type { SeriesMarker, Time } from "lightweight-charts"

import type { TradeDirection } from "@/lib/signal-risk/types"
import type { ExitEvent } from "@/lib/vip-history/types"

function markerLabel(type: ExitEvent["type"]): string {
  switch (type) {
    case "entry":
      return "E"
    case "tp1":
      return "1"
    case "tp2":
      return "2"
    case "tp3":
      return "3"
    case "sl":
      return "S"
    case "timeout_close":
      return "T"
    default: {
      const _exhaustive: never = type
      return _exhaustive
    }
  }
}

function markerColor(type: ExitEvent["type"], pnlUsdt: number): string {
  switch (type) {
    case "entry":
      return "#f0b90b"
    case "sl":
      return "#f6465d"
    case "timeout_close":
      return "#848e9c"
    case "tp1":
    case "tp2":
    case "tp3":
      return pnlUsdt >= 0 ? "#0ecb81" : "#f6465d"
    default: {
      const _exhaustive: never = type
      return _exhaustive
    }
  }
}

export function buildTradeMarkers(
  exits: ExitEvent[],
  direction: TradeDirection,
): SeriesMarker<Time>[] {
  return exits.map((event) => ({
    time: event.time as Time,
    position: "atPriceMiddle",
    price: event.price,
    shape: event.type === "entry" ? "arrowUp" : event.type === "sl" ? "square" : "circle",
    size: event.type === "entry" ? 0.6 : 0.45,
    color: markerColor(event.type, event.pnlUsdt),
    text: markerLabel(event.type),
  }))
}
