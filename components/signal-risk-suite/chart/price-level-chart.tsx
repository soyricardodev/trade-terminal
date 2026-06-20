"use client"

import {
  CandlestickSeries,
  ColorType,
  createChart,
  CrosshairMode,
  LineStyle,
} from "lightweight-charts"
import type {
  CandlestickData,
  IChartApi,
  IPriceLine,
  ISeriesApi,
  Time,
  UTCTimestamp,
} from "lightweight-charts"
import { useEffect, useRef } from "react"

import { ChartToolbar } from "@/components/signal-risk-suite/chart/chart-toolbar"
import { generateSyntheticCandles } from "@/components/signal-risk-suite/chart/synthetic-candles"
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
  className,
}: PriceLevelChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null)
  const priceLinesRef = useRef<IPriceLine[]>([])
  const datasetKeyRef = useRef<string | null>(null)
  const lastBarTimeRef = useRef<Time | null>(null)

  const useFallback =
    status === "error" || (candles.length === 0 && status !== "loading")
  const datasetKey = `${pair}|${interval}|${useFallback ? "synthetic" : "live"}`

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
      },
      timeScale: {
        borderColor: GRID_COLOR,
        timeVisible: true,
        secondsVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
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
    datasetKeyRef.current = null
    lastBarTimeRef.current = null

    return () => {
      chartRef.current = null
      seriesRef.current = null
      datasetKeyRef.current = null
      lastBarTimeRef.current = null
      chart.remove()
    }
  }, [])

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
  }, [setup])

  useEffect(() => {
    const chart = chartRef.current
    const series = seriesRef.current
    if (!chart || !series) return

    const data = useFallback ? generateSyntheticCandles(setup) : candles
    if (data.length === 0) return

    const last = data[data.length - 1]
    const lastTime = last.time
    const datasetChanged = datasetKeyRef.current !== datasetKey
    const timeWentBackwards =
      lastBarTimeRef.current !== null &&
      compareTime(lastTime, lastBarTimeRef.current) < 0

    if (datasetChanged || timeWentBackwards || lastBarTimeRef.current === null) {
      series.setData(data)
      chart.timeScale().fitContent()
      datasetKeyRef.current = datasetKey
      lastBarTimeRef.current = lastTime
      return
    }

    const cmp = compareTime(lastTime, lastBarTimeRef.current)
    if (cmp >= 0) {
      try {
        series.update(last)
        lastBarTimeRef.current = lastTime
      } catch {
        series.setData(data)
        chart.timeScale().fitContent()
        lastBarTimeRef.current = lastTime
      }
    }
  }, [datasetKey, candles, useFallback, setup])

  const displayPrice = lastPrice ?? setup.entry

  return (
    <div className={cn("flex flex-col", className)}>
      <ChartToolbar
        interval={interval}
        onIntervalChange={onIntervalChange}
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
      <div
        ref={containerRef}
        className="h-48 w-full sm:h-56 lg:h-80"
        role="img"
        aria-label={`Price chart for ${pair} ${setup.direction}`}
      />
    </div>
  )
}
