"use client"

import { useCallback, useMemo, useState } from "react"
import { toast } from "sonner"

import { AppShell } from "@/components/signal-risk-suite/app-shell"
import { SignalPastePanel } from "@/components/signal-risk-suite/input/signal-paste-panel"
import { OrderPanel } from "@/components/signal-risk-suite/input/order-panel"
import { PairSelector } from "@/components/signal-risk-suite/input/pair-selector"
import { TradingLayout } from "@/components/signal-risk-suite/layout/trading-layout"
import { JournalPanel } from "@/components/signal-risk-suite/journal/journal-panel"
import { MobileNav, type MobileTab } from "@/components/signal-risk-suite/mobile-nav"
import { RegisterTradeBar } from "@/components/signal-risk-suite/register-trade-bar"
import { RiskDashboard } from "@/components/signal-risk-suite/results/risk-dashboard"
import { PanelSection } from "@/components/signal-risk-suite/ui/panel-section"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useMarkPrice } from "@/hooks/use-mark-price"
import { useTradeJournal } from "@/hooks/use-trade-journal"
import { useTradingPreferences } from "@/hooks/use-trading-preferences"
import { calculateRiskAnalysis } from "@/lib/signal-risk/calculator"
import type { ChartInterval } from "@/lib/market/types"
import type { ParsedVipSignal, TradeSetup } from "@/lib/signal-risk/types"

const DEFAULT_PAIR = "BNB/USDT"

export function SignalRiskSuite() {
  const [activeTab, setActiveTab] = useState<MobileTab>("analyze")
  const [parsedSignal, setParsedSignal] = useState<ParsedVipSignal | null>(null)
  const [rawSignal, setRawSignal] = useState<string | undefined>()
  const [setup, setSetup] = useState<TradeSetup | null>(null)
  const [selectedPair, setSelectedPair] = useState(DEFAULT_PAIR)
  const [chartInterval, setChartInterval] = useState<ChartInterval>("15m")
  const journal = useTradeJournal()
  const preferences = useTradingPreferences()

  const activePair = setup?.pair ?? selectedPair
  const { markPrice, isLive: markPriceLive } = useMarkPrice(activePair)

  const analysis = useMemo(
    () => (setup ? calculateRiskAnalysis(setup) : null),
    [setup],
  )

  const canRegister = Boolean(setup && analysis)

  const handleParsed = useCallback((parsed: ParsedVipSignal, raw: string) => {
    setParsedSignal(parsed)
    setRawSignal(raw)
    setSelectedPair(parsed.pair)
  }, [])

  const handleValidChange = useCallback((next: TradeSetup | null) => {
    setSetup(next)
  }, [])

  const handlePairChange = useCallback((display: string) => {
    setSelectedPair(display)
  }, [])

  function handleSaveTrade() {
    if (!setup || !analysis) return

    journal.saveTrade({
      setup,
      analysis,
      source: rawSignal ? "vip-paste" : "manual",
      rawSignal,
    })
    toast.success("Trade saved to journal")
  }

  function handleCloseTrade(id: string, actualExit: number, notes?: string) {
    const closed = journal.closeTrade(id, actualExit, notes)
    if (closed) {
      toast.success(`Trade closed · ${closed.status}`)
    }
  }

  const desktopTabs = (
    <TabsList variant="line" className="h-9">
      <TabsTrigger value="analyze">Analyze</TabsTrigger>
      <TabsTrigger value="journal">Journal</TabsTrigger>
    </TabsList>
  )

  const orderPanel = (
    <>
      <SignalPastePanel onParsed={handleParsed} className="hidden lg:block" />
      <OrderPanel
        pair={selectedPair}
        parsedSignal={parsedSignal}
        availableBalanceUsdt={preferences.availableBalanceUsdt}
        onAvailableBalanceChange={preferences.setAvailableBalanceUsdt}
        onValidChange={handleValidChange}
        analysis={analysis}
        markPrice={markPrice}
        priceIsLive={markPriceLive}
      />
    </>
  )

  const chartArea =
    analysis && setup ? (
      <RiskDashboard
        analysis={analysis}
        setup={setup}
        pair={activePair}
        interval={chartInterval}
        onIntervalChange={setChartInterval}
        markPrice={markPrice}
      />
    ) : (
      <PanelSection title="Risk dashboard">
        <p className="text-sm text-muted-foreground">
          Select a pair, set entry and position size in the order panel, then
          add TP/SL levels to see live risk metrics and chart.
        </p>
      </PanelSection>
    )

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as MobileTab)}
    >
      <AppShell
        pairSelector={
          <PairSelector value={activePair} onChange={handlePairChange} />
        }
        direction={setup?.direction}
        desktopTabs={desktopTabs}
        mobileNav={
          <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
        }
      >
        <TabsContent value="analyze" className="mt-0 min-w-0 pb-36 lg:pb-24">
          <SignalPastePanel onParsed={handleParsed} className="mb-3 lg:hidden" />

          <div className="flex min-w-0 flex-col gap-3 lg:hidden">
            {analysis && setup && chartArea}
            {orderPanel}
            {!analysis && chartArea}
          </div>

          <div className="hidden min-w-0 lg:block">
            <TradingLayout chartArea={chartArea} orderPanel={orderPanel} />
          </div>

          <RegisterTradeBar
            canRegister={canRegister}
            onRegister={handleSaveTrade}
          />
        </TabsContent>

        <TabsContent value="journal" className="mt-0 min-w-0 pb-20 md:pb-6">
          <JournalPanel
            entries={journal.entries}
            stats={journal.stats}
            hydrated={journal.hydrated}
            onCloseTrade={handleCloseTrade}
            onDeleteTrade={journal.deleteTrade}
            onExport={journal.exportJson}
            onImport={journal.importJson}
          />
        </TabsContent>
      </AppShell>
    </Tabs>
  )
}
