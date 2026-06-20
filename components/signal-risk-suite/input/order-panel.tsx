"use client"

import {
  IconChevronDown,
  IconChevronUp,
  IconCoin,
  IconWallet,
} from "@tabler/icons-react"
import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { LeverageSelector } from "@/components/signal-risk-suite/input/leverage-selector"
import { MarginPercentSlider } from "@/components/signal-risk-suite/input/margin-percent-slider"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  tradeSetupSchema,
  type TradeSetupFormValues,
} from "@/lib/signal-risk/schema"
import type { ParsedVipSignal, RiskAnalysis, TradeSetup } from "@/lib/signal-risk/types"
import { cn, formatPrice, formatUsdt } from "@/lib/utils"

const defaultValues: TradeSetupFormValues = {
  pair: "BNB/USDT",
  direction: "LONG",
  entry: 0,
  stopLoss: 0,
  tp1: 0,
  tp2: 0,
  tp3: 0,
  marginUsdt: 100,
  leverage: 10,
}

interface OrderPanelProps {
  pair: string
  parsedSignal?: ParsedVipSignal | null
  availableBalanceUsdt: number
  onAvailableBalanceChange: (value: number) => void
  onValidChange: (setup: TradeSetup | null) => void
  analysis?: RiskAnalysis | null
  markPrice?: number | null
  priceIsLive?: boolean
  className?: string
}

export function OrderPanel({
  pair,
  parsedSignal,
  availableBalanceUsdt,
  onAvailableBalanceChange,
  onValidChange,
  analysis,
  markPrice,
  priceIsLive = false,
  className,
}: OrderPanelProps) {
  const [tpSlOpen, setTpSlOpen] = useState(true)
  const [accountOpen, setAccountOpen] = useState(false)

  const form = useForm<TradeSetupFormValues>({
    resolver: zodResolver(tradeSetupSchema),
    defaultValues,
    mode: "onChange",
  })

  const {
    register,
    watch,
    setValue,
    formState: { errors, isValid },
  } = form

  useEffect(() => {
    setValue("pair", pair, { shouldValidate: true })
  }, [pair, setValue])

  useEffect(() => {
    if (!parsedSignal) return

    setValue("pair", parsedSignal.pair, { shouldValidate: true })
    setValue("direction", parsedSignal.direction, { shouldValidate: true })
    setValue("entry", parsedSignal.entry, { shouldValidate: true })
    setValue("stopLoss", parsedSignal.stopLoss, { shouldValidate: true })
    setValue("tp1", parsedSignal.tp1, { shouldValidate: true })
    setValue("tp2", parsedSignal.tp2, { shouldValidate: true })
    setValue("tp3", parsedSignal.tp3, { shouldValidate: true })
  }, [parsedSignal, setValue])

  useEffect(() => {
    const subscription = watch((values) => {
      const result = tradeSetupSchema.safeParse(values)
      onValidChange(result.success ? result.data : null)
    })
    return () => subscription.unsubscribe()
  }, [watch, onValidChange])

  const direction = watch("direction")
  const leverage = watch("leverage")
  const marginUsdt = watch("marginUsdt")
  const entry = watch("entry")
  const notionalPreview = marginUsdt * leverage

  function fillEntryFromMarket() {
    if (markPrice && markPrice > 0) {
      setValue("entry", markPrice, { shouldValidate: true })
    }
  }

  return (
    <section className={cn("min-w-0 border border-border bg-surface", className)}>
      <div>
        <header className="border-b border-border px-3 py-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium">Place order</h2>
            {markPrice !== null && markPrice !== undefined && (
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    priceIsLive ? "bg-long animate-pulse" : "bg-muted-foreground/50",
                  )}
                  aria-hidden
                />
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {formatPrice(markPrice)}
                </span>
              </div>
            )}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {(["LONG", "SHORT"] as const).map((value) => (
              <Button
                key={value}
                type="button"
                variant="ghost"
                onClick={() =>
                  setValue("direction", value, { shouldValidate: true })
                }
                className={cn(
                  "h-11 rounded-none text-sm font-semibold",
                  direction === value &&
                    (value === "LONG"
                      ? "bg-long text-primary-foreground hover:bg-long/90"
                      : "bg-short text-white hover:bg-short/90"),
                  direction !== value && "bg-elevated text-muted-foreground",
                )}
              >
                {value === "LONG" ? "Long" : "Short"}
              </Button>
            ))}
          </div>
        </header>

        <div className="flex flex-col gap-4 p-3">
          <LeverageSelector
            value={leverage}
            onChange={(value) =>
              setValue("leverage", value, { shouldValidate: true })
            }
          />

          <Field data-invalid={!!errors.entry}>
            <div className="flex items-center justify-between gap-2">
              <FieldLabel htmlFor="entry" className="text-xs">
                Entry price
              </FieldLabel>
              {markPrice !== null && markPrice !== undefined && (
                <button
                  type="button"
                  onClick={fillEntryFromMarket}
                  className="text-xs text-primary hover:underline"
                >
                  Use market
                </button>
              )}
            </div>
            <FieldContent>
              <Input
                id="entry"
                type="number"
                step="any"
                placeholder={markPrice ? formatPrice(markPrice) : "0.00"}
                className="h-10 bg-void font-mono text-base tabular-nums"
                {...register("entry", { valueAsNumber: true })}
              />
              <FieldError errors={[errors.entry]} />
            </FieldContent>
          </Field>

          <div className="rounded-none border border-border bg-void/50 p-3">
            <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <IconCoin className="size-3.5" aria-hidden />
              Position size
            </div>
            <Field data-invalid={!!errors.marginUsdt}>
              <FieldContent>
                <div className="relative">
                  <Input
                    id="marginUsdt"
                    type="number"
                    step="any"
                    className="h-11 bg-void pr-14 font-mono text-lg tabular-nums"
                    {...register("marginUsdt", { valueAsNumber: true })}
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                    USDT
                  </span>
                </div>
                <MarginPercentSlider
                  availableBalanceUsdt={availableBalanceUsdt}
                  marginUsdt={marginUsdt}
                  onMarginChange={(value) =>
                    setValue("marginUsdt", value, { shouldValidate: true })
                  }
                  className="mt-3"
                />
                <FieldError errors={[errors.marginUsdt]} />
              </FieldContent>
            </Field>
          </div>

          <div className="grid gap-2 rounded-none border border-border bg-elevated/50 p-3 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Notional</span>
              <span className="font-mono font-medium tabular-nums">
                {formatUsdt(notionalPreview)}
              </span>
            </div>
            {analysis && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max loss</span>
                  <span className="font-mono tabular-nums text-short">
                    {formatUsdt(-analysis.maxLossUsdt)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max gain</span>
                  <span className="font-mono tabular-nums text-long">
                    {formatUsdt(analysis.maxGainUsdt)}
                  </span>
                </div>
              </>
            )}
            <p className="border-t border-border pt-2 text-[10px] text-muted-foreground">
              Exit plan: 50% at TP1 · 30% at TP2 · 20% at TP3
            </p>
          </div>

          <div className="border border-border">
            <button
              type="button"
              onClick={() => setAccountOpen((prev) => !prev)}
              className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium"
            >
              <span className="flex items-center gap-1.5">
                <IconWallet className="size-3.5" aria-hidden />
                Simulated balance
              </span>
              {accountOpen ? (
                <IconChevronUp className="size-3.5" aria-hidden />
              ) : (
                <IconChevronDown className="size-3.5" aria-hidden />
              )}
            </button>
            {accountOpen && (
              <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2">
                <span className="text-xs text-muted-foreground">Available</span>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    step="any"
                    value={availableBalanceUsdt}
                    onChange={(event) =>
                      onAvailableBalanceChange(Number(event.target.value))
                    }
                    className="h-8 w-28 bg-void px-2 text-right font-mono text-xs tabular-nums"
                  />
                  <span className="text-xs text-muted-foreground">USDT</span>
                </div>
              </div>
            )}
          </div>

          <FieldGroup className="gap-3">
            <div className="border border-border">
              <button
                type="button"
                onClick={() => setTpSlOpen((prev) => !prev)}
                className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium"
              >
                Take profit / Stop loss
                {tpSlOpen ? (
                  <IconChevronUp className="size-3.5" aria-hidden />
                ) : (
                  <IconChevronDown className="size-3.5" aria-hidden />
                )}
              </button>

              {tpSlOpen && (
                <div className="flex flex-col gap-3 border-t border-border p-3">
                  <Field data-invalid={!!errors.stopLoss}>
                    <FieldLabel htmlFor="stopLoss" className="text-xs">
                      Stop loss
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        id="stopLoss"
                        type="number"
                        step="any"
                        className="h-9 bg-void font-mono text-sm tabular-nums"
                        {...register("stopLoss", { valueAsNumber: true })}
                      />
                      <FieldError errors={[errors.stopLoss]} />
                    </FieldContent>
                  </Field>

                  {(["tp1", "tp2", "tp3"] as const).map((name, index) => (
                    <Field key={name} data-invalid={!!errors[name]}>
                      <FieldLabel htmlFor={name} className="text-xs">
                        TP{index + 1}
                      </FieldLabel>
                      <FieldContent>
                        <Input
                          id={name}
                          type="number"
                          step="any"
                          className="h-9 bg-void font-mono text-sm tabular-nums"
                          {...register(name, { valueAsNumber: true })}
                        />
                        <FieldError errors={[errors[name]]} />
                      </FieldContent>
                    </Field>
                  ))}
                </div>
              )}
            </div>

            {!isValid && (
              <p className="text-xs text-muted-foreground">
                {entry <= 0
                  ? "Set entry price — tap “Use market” or paste a VIP signal."
                  : `Complete valid ${direction} price levels (SL and TPs in order).`}
              </p>
            )}
          </FieldGroup>
        </div>
      </div>
    </section>
  )
}
