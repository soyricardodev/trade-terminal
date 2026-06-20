import { z } from "zod"

const positiveNumber = z.number().positive("Must be greater than 0")

export const tradeSetupSchema = z
  .object({
    pair: z.string().min(1, "Pair is required"),
    direction: z.enum(["LONG", "SHORT"]),
    entry: positiveNumber,
    stopLoss: positiveNumber,
    tp1: positiveNumber,
    tp2: positiveNumber,
    tp3: positiveNumber,
    marginUsdt: positiveNumber,
    leverage: z.number().min(1, "Leverage must be at least 1"),
  })
  .superRefine((data, ctx) => {
    if (data.direction === "LONG") {
      if (data.stopLoss >= data.entry) {
        ctx.addIssue({
          code: "custom",
          message: "Stop loss must be below entry for LONG",
          path: ["stopLoss"],
        })
      }
      if (data.tp1 <= data.entry) {
        ctx.addIssue({
          code: "custom",
          message: "TP1 must be above entry for LONG",
          path: ["tp1"],
        })
      }
      if (data.tp2 <= data.tp1) {
        ctx.addIssue({
          code: "custom",
          message: "TP2 must be above TP1 for LONG",
          path: ["tp2"],
        })
      }
      if (data.tp3 <= data.tp2) {
        ctx.addIssue({
          code: "custom",
          message: "TP3 must be above TP2 for LONG",
          path: ["tp3"],
        })
      }
    } else {
      if (data.stopLoss <= data.entry) {
        ctx.addIssue({
          code: "custom",
          message: "Stop loss must be above entry for SHORT",
          path: ["stopLoss"],
        })
      }
      if (data.tp1 >= data.entry) {
        ctx.addIssue({
          code: "custom",
          message: "TP1 must be below entry for SHORT",
          path: ["tp1"],
        })
      }
      if (data.tp2 >= data.tp1) {
        ctx.addIssue({
          code: "custom",
          message: "TP2 must be below TP1 for SHORT",
          path: ["tp2"],
        })
      }
      if (data.tp3 >= data.tp2) {
        ctx.addIssue({
          code: "custom",
          message: "TP3 must be below TP2 for SHORT",
          path: ["tp3"],
        })
      }
    }
  })

export type TradeSetupFormValues = z.infer<typeof tradeSetupSchema>
