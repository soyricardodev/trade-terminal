"use client"

import { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { LeverageSlider } from "@/components/signal-risk-suite/input/leverage-slider"
import { PanelSection } from "@/components/signal-risk-suite/ui/panel-section"
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
import type { ParsedVipSignal, TradeSetup } from "@/lib/signal-risk/types"
import { cn } from "@/lib/utils"

const defaultValues: TradeSetupFormValues = {
  pair: "",
  direction: "LONG",
  entry: 0,
  stopLoss: 0,
  tp1: 0,
  tp2: 0,
  tp3: 0,
  marginUsdt: 100,
  leverage: 10,
}

interface TradeSetupFormProps {
  parsedSignal?: ParsedVipSignal | null
  onValidChange: (setup: TradeSetup | null) => void
  className?: string
}

export function TradeSetupForm({
  parsedSignal,
  onValidChange,
  className,
}: TradeSetupFormProps) {
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

  return (
    <PanelSection
      title="Trade setup"
      description="Adjust extracted values and set margin plus leverage."
      className={className}
    >
      <FieldGroup className="gap-3">
        <Field data-invalid={!!errors.pair}>
          <FieldLabel htmlFor="pair" className="text-xs">
            Pair
          </FieldLabel>
          <FieldContent>
            <Input
              id="pair"
              placeholder="BNB/USDT"
              className="h-9 bg-void text-sm"
              {...register("pair")}
            />
            <FieldError errors={[errors.pair]} />
          </FieldContent>
        </Field>

        <Field data-invalid={!!errors.direction}>
          <FieldLabel className="text-xs">Direction</FieldLabel>
          <FieldContent>
            <div className="flex border border-border">
              {(["LONG", "SHORT"] as const).map((value) => (
                <Button
                  key={value}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setValue("direction", value, { shouldValidate: true })
                  }
                  className={cn(
                    "h-9 flex-1 rounded-none text-sm font-medium",
                    direction === value &&
                      (value === "LONG"
                        ? "bg-long/15 text-long hover:bg-long/20"
                        : "bg-short/15 text-short hover:bg-short/20"),
                  )}
                >
                  {value}
                </Button>
              ))}
            </div>
            <FieldError errors={[errors.direction]} />
          </FieldContent>
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["entry", "Entry"],
              ["stopLoss", "Stop loss"],
              ["tp1", "TP1"],
              ["tp2", "TP2"],
              ["tp3", "TP3"],
              ["marginUsdt", "Margin (USDT)"],
            ] as const
          ).map(([name, label]) => (
            <Field key={name} data-invalid={!!errors[name]}>
              <FieldLabel htmlFor={name} className="text-xs">
                {label}
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

        <LeverageSlider
          value={leverage}
          onChange={(value) =>
            setValue("leverage", value, { shouldValidate: true })
          }
        />

        {!isValid && (
          <p className="text-xs text-muted-foreground">
            Complete all fields with valid LONG/SHORT price ordering to see risk
            metrics.
          </p>
        )}
      </FieldGroup>
    </PanelSection>
  )
}
