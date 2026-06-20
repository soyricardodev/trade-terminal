"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { VipHistoryAnalyticsPanel } from "@/components/signal-risk-suite/history/vip-history-analytics-panel"
import { VipHistoryBySymbol } from "@/components/signal-risk-suite/history/vip-history-by-symbol"
import {
  defaultParamsFromReport,
  VipHistoryParamsPanel,
} from "@/components/signal-risk-suite/history/vip-history-params-panel"
import { VipHistoryInsights } from "@/components/signal-risk-suite/history/vip-history-insights"
import { VipHistoryStats } from "@/components/signal-risk-suite/history/vip-history-stats"
import { VipHistoryTable } from "@/components/signal-risk-suite/history/vip-history-table"
import { VipSignalDetail } from "@/components/signal-risk-suite/history/vip-signal-detail"
import { PanelSection } from "@/components/signal-risk-suite/ui/panel-section"
import { buildVipHistoryAnalytics } from "@/lib/vip-history/analytics"
import type {
  BacktestParams,
  BacktestReport,
  BacktestResult,
  DirectionFilter,
  OutcomeFilter,
} from "@/lib/vip-history/types"

const DATA_URL = "/data/vip-backtest-results.json"

export function VipHistoryPanel() {
  const [report, setReport] = useState<BacktestReport | null>(null)
  const [params, setParams] = useState<BacktestParams | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [recomputing, setRecomputing] = useState(false)
  const [selectedResult, setSelectedResult] = useState<BacktestResult | null>(null)
  const [pairFilter, setPairFilter] = useState<string | null>(null)
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>("all")
  const [outcomeFilter, setOutcomeFilter] = useState<OutcomeFilter>("all")

  useEffect(() => {
    let disposed = false

    async function loadReport() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(DATA_URL)
        if (!response.ok) {
          throw new Error(`Failed to load backtest data (${response.status})`)
        }

        const body = (await response.json()) as BacktestReport
        if (disposed) return

        setReport(body)
        setParams(defaultParamsFromReport(body.params))
        setSelectedResult(body.results[0] ?? null)
      } catch (loadError) {
        if (disposed) return
        const message =
          loadError instanceof Error
            ? loadError.message
            : "Failed to load backtest data"
        setError(message)
      } finally {
        if (!disposed) setLoading(false)
      }
    }

    void loadReport()

    return () => {
      disposed = true
    }
  }, [])

  const recompute = useCallback(async () => {
    if (!params) return

    setRecomputing(true)
    setError(null)

    try {
      const response = await fetch("/api/vip-history/recompute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string
        } | null
        throw new Error(body?.error ?? `Recompute failed (${response.status})`)
      }

      const body = (await response.json()) as BacktestReport
      setReport(body)
      setSelectedResult((current) => {
        if (!current) return body.results[0] ?? null
        return (
          body.results.find((result) => result.signal.id === current.signal.id) ??
          body.results[0] ??
          null
        )
      })
    } catch (recomputeError) {
      const message =
        recomputeError instanceof Error
          ? recomputeError.message
          : "Failed to recalculate"
      setError(message)
    } finally {
      setRecomputing(false)
    }
  }, [params])

  const uniquePairs = useMemo(() => {
    if (!report) return []
    return [...new Set(report.results.map((result) => result.signal.parsed.pair))].sort()
  }, [report])

  const analytics = useMemo(
    () => (report ? buildVipHistoryAnalytics(report.results) : null),
    [report],
  )

  if (loading) {
    return (
      <PanelSection title="Historial VIP">
        <p className="text-sm text-muted-foreground">Loading backtest results…</p>
      </PanelSection>
    )
  }

  if (error && !report) {
    return (
      <PanelSection title="Historial VIP">
        <p className="text-sm text-muted-foreground">
          {error ??
            "No backtest data found. Run `bun run backtest:vip` to generate results."}
        </p>
      </PanelSection>
    )
  }

  if (!report || !params || !analytics) {
    return (
      <PanelSection title="Historial VIP">
        <p className="text-sm text-muted-foreground">
          No backtest data found. Run `bun run backtest:vip` to generate results.
        </p>
      </PanelSection>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <PanelSection
        title="Historial VIP"
        description={`${report.stats.global.executed} executed · ${report.stats.global.timeouts + (report.stats.global.inconclusive ?? 0)} timeouts · ${params.observationHours}h · ${params.marginUsdt} USDT @ ${params.leverage}x`}
      >
        <div className="flex flex-col gap-3">
          <VipHistoryParamsPanel
            params={params}
            onChange={setParams}
            onRecompute={recompute}
            recomputing={recomputing}
          />
          {error && <p className="text-xs text-short">{error}</p>}
          <VipHistoryStats stats={report.stats.global} />
          <VipHistoryInsights stats={report.stats.global} params={params} />
        </div>
      </PanelSection>

      <PanelSection title="Deep analytics">
        <VipHistoryAnalyticsPanel analytics={analytics} />
      </PanelSection>

      <div className="grid min-w-0 gap-3 xl:grid-cols-2">
        <PanelSection title="Ranking by pair">
          <VipHistoryBySymbol
            stats={report.stats.bySymbol}
            selectedSymbol={pairFilter}
            onSelectSymbol={setPairFilter}
          />
        </PanelSection>

        <PanelSection title="Signal detail">
          <VipSignalDetail result={selectedResult} params={params} />
        </PanelSection>
      </div>

      <PanelSection
        title="All signals"
        action={
          <div className="flex flex-wrap gap-2 text-xs">
            <select
              className="border border-border bg-background px-2 py-1"
              value={pairFilter ?? ""}
              onChange={(event) => setPairFilter(event.target.value || null)}
            >
              <option value="">All pairs</option>
              {uniquePairs.map((pair) => (
                <option key={pair} value={pair}>
                  {pair}
                </option>
              ))}
            </select>
            <select
              className="border border-border bg-background px-2 py-1"
              value={directionFilter}
              onChange={(event) =>
                setDirectionFilter(event.target.value as DirectionFilter)
              }
            >
              <option value="all">All directions</option>
              <option value="LONG">LONG</option>
              <option value="SHORT">SHORT</option>
            </select>
            <select
              className="border border-border bg-background px-2 py-1"
              value={outcomeFilter}
              onChange={(event) =>
                setOutcomeFilter(event.target.value as OutcomeFilter)
              }
            >
              <option value="all">All outcomes</option>
              <option value="full_win">Full win</option>
              <option value="partial_win">Partial win</option>
              <option value="win">Win</option>
              <option value="breakeven">Breakeven</option>
              <option value="loss">Loss</option>
              <option value="timeout">Timeout</option>
              <option value="inconclusive">Inconclusive</option>
              <option value="not_executed">Not executed</option>
              <option value="risk_filtered">Risk filtered</option>
              <option value="no_data">No data</option>
            </select>
          </div>
        }
      >
        <VipHistoryTable
          results={report.results}
          selectedId={selectedResult?.signal.id ?? null}
          pairFilter={pairFilter}
          directionFilter={directionFilter}
          outcomeFilter={outcomeFilter}
          onSelect={setSelectedResult}
        />
      </PanelSection>
    </div>
  )
}
