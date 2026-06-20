"use client"

import { IconChevronDown, IconSearch } from "@tabler/icons-react"
import { useEffect, useMemo, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { MarketSymbol } from "@/lib/market/types"
import { cn } from "@/lib/utils"

const RECENT_KEY = "trade-terminal:recent-pairs"
const MAX_RECENT = 5

function readRecentPairs(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : []
  } catch {
    return []
  }
}

function writeRecentPair(display: string) {
  const recent = readRecentPairs().filter((item) => item !== display)
  recent.unshift(display)
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)))
}

interface PairSelectorProps {
  value: string
  onChange: (display: string) => void
  className?: string
}

export function PairSelector({ value, onChange, className }: PairSelectorProps) {
  const [symbols, setSymbols] = useState<MarketSymbol[]>([])
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recent, setRecent] = useState<string[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setRecent(readRecentPairs())
  }, [])

  useEffect(() => {
    let disposed = false

    async function loadSymbols() {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch("/api/market/symbols")
        if (!response.ok) {
          throw new Error("Failed to load symbols")
        }
        const body = (await response.json()) as { symbols: MarketSymbol[] }
        if (!disposed) {
          setSymbols(body.symbols)
        }
      } catch (fetchError) {
        if (!disposed) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Failed to load symbols",
          )
        }
      } finally {
        if (!disposed) setLoading(false)
      }
    }

    void loadSymbols()
    return () => {
      disposed = true
    }
  }, [])

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    return () => document.removeEventListener("mousedown", handlePointerDown)
  }, [])

  const filtered = useMemo(() => {
    const normalized = query.trim().toUpperCase()
    if (!normalized) return symbols

    return symbols.filter(
      (item) =>
        item.display.toUpperCase().includes(normalized) ||
        item.symbol.includes(normalized) ||
        item.baseAsset.toUpperCase().includes(normalized),
    )
  }, [query, symbols])

  const recentSymbols = useMemo(
    () =>
      recent
        .map((display) => symbols.find((item) => item.display === display))
        .filter((item): item is MarketSymbol => Boolean(item)),
    [recent, symbols],
  )

  function selectPair(display: string) {
    onChange(display)
    writeRecentPair(display)
    setRecent(readRecentPairs())
    setOpen(false)
    setQuery("")
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 border-border bg-void px-2.5 font-mono text-xs"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>{value || "Select pair"}</span>
        <IconChevronDown className="size-3.5 text-muted-foreground" aria-hidden />
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-[min(16rem,calc(100vw-2rem))] border border-border bg-surface shadow-lg">
          <div className="border-b border-border p-2">
            <div className="relative">
              <IconSearch
                className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search USDT-M…"
                className="h-8 bg-void pl-8 text-xs"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto p-1">
            {loading && (
              <p className="px-2 py-3 text-xs text-muted-foreground">Loading pairs…</p>
            )}
            {error && (
              <p className="px-2 py-3 text-xs text-destructive">{error}</p>
            )}

            {!loading && !error && query === "" && recentSymbols.length > 0 && (
              <>
                <p className="px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Recent
                </p>
                {recentSymbols.map((item) => (
                  <button
                    key={`recent-${item.symbol}`}
                    type="button"
                    onClick={() => selectPair(item.display)}
                    className={cn(
                      "flex w-full items-center px-2 py-1.5 text-left text-xs hover:bg-foreground/5",
                      value === item.display && "bg-primary/10 text-primary",
                    )}
                  >
                    {item.display}
                  </button>
                ))}
              </>
            )}

            {!loading &&
              !error &&
              filtered.slice(0, 100).map((item) => (
                <button
                  key={item.symbol}
                  type="button"
                  onClick={() => selectPair(item.display)}
                  className={cn(
                    "flex w-full items-center px-2 py-1.5 text-left text-xs hover:bg-foreground/5",
                    value === item.display && "bg-primary/10 text-primary",
                  )}
                >
                  <span className="font-mono">{item.display}</span>
                  <span className="ml-auto text-muted-foreground">{item.baseAsset}</span>
                </button>
              ))}

            {!loading && !error && filtered.length === 0 && (
              <p className="px-2 py-3 text-xs text-muted-foreground">No pairs found</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
