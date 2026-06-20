"use client"

import {
  CandlestickSeries,
  ColorType,
  createChart,
  createSeriesMarkers,
  CrosshairMode,
  LineStyle,
} from "lightweight-charts"
import type {
  CandlestickData,
  IChartApi,
  IPriceLine,
  ISeriesApi,
  ISeriesMarkersPluginApi,
  SeriesMarker,
  Time,
  UTCTimestamp,
} from "lightweight-charts"
import { useEffect, useMemo, useRef } from "react"

import { ChartToolbar } from "@/components/signal-risk-suite/chart/chart-toolbar"
import { generateSyntheticCandles } from "@/components/signal-risk-suite/chart/synthetic-candles"
import {
  derivePriceFormatFromSetup,
  visiblePriceRange,
} from "@/lib/chart/price-format"
import type { ChartInterval, MarketKlinesStatus } from "@/lib/market/types"
import type { TradeSetup } from "@/lib/signal-risk/types"
import { cn } from "@/lib/utils"

interface PriceLevelChartProps {
  setup: TradeSetup
  pair: string
  interval: ChartInterval
  onIntervalChange: (interval: ChartInterval) => void
  candles: CandlestickData<UTCTimestamp>[]
  status: MarketKlinesStatus
  lastPrice: number | null
  isLive: boolean
  error: string | null
  scopeKey?: string
  intervals?: ChartInterval[]
  allowSyntheticFallback?: boolean
  markers?: SeriesMarker<Time>[]
  className?: string
}

const CHART_BG = "#0d1117"
const GRID_COLOR = "#21262d"
const TEXT_COLOR = "#848e9c"

function compareTime(a: Time, b: Time): number {
  if (typeof a === "number" && typeof b === "number") return a - b
  return String(a).localeCompare(String(b))
}

export function PriceLevelChart({
  setup,
  pair,
  interval,
  onIntervalChange,
  candles,
  status,
  lastPrice,
  isLive,
  error,
  scopeKey = "",
  intervals,
  allowSyntheticFallback = true,
  markers = [],
  className,
}: PriceLevelChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null)
  const markersPluginRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null)
  const priceLinesRef = useRef<IPriceLine[]>([])

  const priceFormat = useMemo(() => derivePriceFormatFromSetup(setup), [setup])

  const useFallback =
    allowSyntheticFallback &&
    (status === "error" || (candles.length === 0 && status !== "loading"))
  const isLoading = status === "loading" || candles.length === 0
  const dataKey = `${scopeKey}|${pair}|${interval}|${useFallback ? "syn" : "live"}`

  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: CHART_BG },
        textColor: TEXT_COLOR,
        fontFamily: "var(--font-mono), ui-monospace, monospace",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: GRID_COLOR },
        horzLines: { color: GRID_COLOR },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { labelVisible: false },
        horzLine: { labelVisible: true },
      },
      rightPriceScale: {
        borderColor: GRID_COLOR,
        scaleMargins: { top: 0.08, bottom: 0.08 },
        autoScale: true,
      },
      timeScale: {
        borderColor: GRID_COLOR,
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: { vertTouchDrag: false },
    })

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#0ecb81",
      downColor: "#f6465d",
      borderUpColor: "#0ecb81",
      borderDownColor: "#f6465d",
      wickUpColor: "#0ecb81",
      wickDownColor: "#f6465d",
    })

    chartRef.current = chart
    seriesRef.current = series
    markersPluginRef.current = createSeriesMarkers(series, [], { autoScale: false })

    return () => {
      markersPluginRef.current = null
      chartRef.current = null
      seriesRef.current = null
      chart.remove()
    }
  }, [])

  useEffect(() => {
    seriesRef.current?.applyOptions({ priceFormat })
  }, [priceFormat])

  useEffect(() => {
    const series = seriesRef.current
    if (!series) return

    for (const line of priceLinesRef.current) {
      series.removePriceLine(line)
    }
    priceLinesRef.current = []

    const priceLines = [
      {
        price: setup.entry,
        color: "#f0b90b",
        lineWidth: 2 as const,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: "Entry",
      },
      {
        price: setup.stopLoss,
        color: "#f6465d",
        lineWidth: 1 as const,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: "SL",
      },
      {
        price: setup.tp1,
        color: "rgba(14, 203, 129, 1)",
        lineWidth: 1 as const,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: "TP1",
      },
      {
        price: setup.tp2,
        color: "rgba(14, 203, 129, 0.7)",
        lineWidth: 1 as const,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: "TP2",
      },
      {
        price: setup.tp3,
        color: "rgba(14, 203, 129, 0.45)",
        lineWidth: 1 as const,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: "TP3",
      },
    ]

    for (const options of priceLines) {
      priceLinesRef.current.push(series.createPriceLine(options))
    }
  }, [setup, priceFormat])

  useEffect(() => {
    const chart = chartRef.current
    const series = seriesRef.current
    if (!chart || !series) return

    markersPluginRef.current?.setMarkers([])

    const data = useFallback ? generateSyntheticCandles(setup) : candles
    if (data.length === 0) {
      series.setData([])
      return
    }

    series.setData(data)
    chart.priceScale("right").setVisibleRange(visiblePriceRange(setup, data))
    chart.timeScale().fitContent()
    markersPluginRef.current?.setMarkers(markers)
  }, [dataKey, candles, useFallback, setup, markers])

  const displayPrice = lastPrice ?? setup.entry

  return (
    <div className={cn("relative flex flex-col", className)}>
      <ChartToolbar
        interval={interval}
        onIntervalChange={onIntervalChange}
        intervals={intervals}
        lastPrice={displayPrice}
        isLive={isLive}
        streamStatus={status}
        isFallback={useFallback}
      />
      {error && useFallback && (
        <p className="border-b border-border bg-warning/10 px-3 py-1.5 text-xs text-warning">
          {error}
        </p>
      )}
      <div className="relative">
        {isLoading && !useFallback && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-chart-bg/70 text-xs text-muted-foreground">
            Loading chart…
          </div>
        )}
        <div
          ref={containerRef}
          className={cn(
            "h-48 w-full sm:h-56 lg:h-80",
            isLoading && !useFallback && "opacity-40",
          )}
          role="img"
          aria-label={`Price chart for ${pair} ${setup.direction}`}
        />
      </div>
    </div>
  )
}
