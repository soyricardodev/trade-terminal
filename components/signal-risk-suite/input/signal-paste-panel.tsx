"use client"



import { IconChevronDown, IconChevronUp } from "@tabler/icons-react"

import { useState } from "react"

import { toast } from "sonner"



import { Badge } from "@/components/ui/badge"

import { Button } from "@/components/ui/button"

import { Textarea } from "@/components/ui/textarea"

import type { ParsedVipSignal } from "@/lib/signal-risk/types"

import { parseVipSignal } from "@/lib/vip-signal/parser"

import { cn, formatPrice } from "@/lib/utils"



interface SignalPastePanelProps {

  onParsed: (parsed: ParsedVipSignal, raw: string) => void

  className?: string

  defaultOpen?: boolean

}



export function SignalPastePanel({

  onParsed,

  className,

  defaultOpen = false,

}: SignalPastePanelProps) {

  const [open, setOpen] = useState(defaultOpen)

  const [raw, setRaw] = useState("")

  const [preview, setPreview] = useState<ParsedVipSignal | null>(null)



  function handleExtract() {

    const parsed = parseVipSignal(raw)

    if (!parsed) {

      toast.error("Could not parse VIP signal. Check format or fill manually.")

      setPreview(null)

      return

    }



    setPreview(parsed)

    onParsed(parsed, raw)



    if (parsed.warnings.length > 0) {

      toast.warning("Signal parsed with warnings — review stop loss and entry.")

    } else {

      toast.success(`${parsed.pair} ${parsed.direction} extracted`)

    }

  }



  return (

    <section className={cn("min-w-0 border border-border bg-surface", className)}>

      <button

        type="button"

        onClick={() => setOpen((prev) => !prev)}

        className="flex w-full items-center justify-between border-b border-border px-3 py-2.5 text-left"

      >

        <div>

          <h2 className="text-sm font-medium">VIP signal</h2>

          <p className="mt-0.5 text-xs text-muted-foreground">

            Paste a VIP message to prefill entry, SL, and TPs.

          </p>

        </div>

        {open ? (

          <IconChevronUp className="size-4 shrink-0 text-muted-foreground" aria-hidden />

        ) : (

          <IconChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />

        )}

      </button>



      {open && (

        <div className="flex flex-col gap-3 p-3">

          <Textarea

            value={raw}

            onChange={(event) => setRaw(event.target.value)}

            placeholder="Paste VIP signal text here…"

            className="min-h-28 border-border bg-void font-mono text-xs"

          />

          <Button

            type="button"

            variant="terminal"

            size="sm"

            onClick={handleExtract}

            disabled={!raw.trim()}

          >

            Extract signal

          </Button>



          {preview && (

            <div className="flex min-w-0 flex-col gap-2 overflow-hidden border border-border bg-void p-3">

              <div className="flex flex-wrap items-center gap-1.5">

                <span className="text-sm font-medium">{preview.pair}</span>

                <Badge

                  variant="outline"

                  className={cn(

                    "text-xs",

                    preview.direction === "LONG"

                      ? "border-long/40 text-long"

                      : "border-short/40 text-short",

                  )}

                >

                  {preview.direction}

                </Badge>

                {preview.entryIsRange && (

                  <Badge variant="outline" className="border-warning/40 text-xs text-warning">

                    Range → min entry

                  </Badge>

                )}

              </div>

              <div className="grid min-w-0 grid-cols-2 gap-x-3 gap-y-2 text-xs sm:grid-cols-3">

                {(

                  [

                    ["Entry", preview.entryIsRange

                      ? `${formatPrice(preview.entryMin!)}–${formatPrice(preview.entryMax!)} → ${formatPrice(preview.entry)}`

                      : formatPrice(preview.entry)],

                    ["SL", formatPrice(preview.stopLoss)],

                    ["TP1", formatPrice(preview.tp1)],

                    ["TP2", formatPrice(preview.tp2)],

                    ["TP3", formatPrice(preview.tp3)],

                  ] as const

                ).map(([label, value]) => (

                  <div key={label} className="min-w-0">
                    <span className="text-muted-foreground">{label}</span>
                    <p className="truncate font-mono tabular-nums">{value}</p>
                  </div>

                ))}

              </div>

              {preview.warnings.length > 0 && (

                <ul className="flex flex-col gap-1 text-xs text-warning">

                  {preview.warnings.map((warning) => (

                    <li key={warning}>{warning}</li>

                  ))}

                </ul>

              )}

            </div>

          )}

        </div>

      )}

    </section>

  )

}

