import { NextResponse } from "next/server"
import { z } from "zod"

import { paramsFromPreset } from "@/lib/vip-history/params"
import { recomputeBacktestReport } from "@/lib/vip-history/recompute"

const paramsSchema = z.object({
  marginUsdt: z.number().positive().default(1000),
  leverage: z.number().positive().default(5),
  observationHours: z.number().positive().default(24),
  exitWeights: z.tuple([z.number(), z.number(), z.number()]).optional(),
  moveSlToBreakevenAfterTp1: z.boolean().optional(),
  capLossAtMargin: z.boolean().optional(),
  maxRiskPctOfMargin: z.number().positive().max(100).nullable().optional(),
  skipHighRiskSignals: z.boolean().optional(),
  timeoutTreatment: z.enum(["market_close", "inconclusive"]).optional(),
  excludeTimeoutsFromStats: z.boolean().optional(),
  presetId: z.enum(["50-30-20", "100-tp1", "100-tp2", "100-tp3"]).optional(),
})

export async function POST(request: Request) {
  try {
    const body = paramsSchema.parse(await request.json())

    const params = body.presetId
      ? paramsFromPreset(body.presetId, {
          marginUsdt: body.marginUsdt,
          leverage: body.leverage,
          observationHours: body.observationHours,
          capLossAtMargin: body.capLossAtMargin,
          maxRiskPctOfMargin: body.maxRiskPctOfMargin ?? null,
          skipHighRiskSignals: body.skipHighRiskSignals,
          timeoutTreatment: body.timeoutTreatment,
          excludeTimeoutsFromStats: body.excludeTimeoutsFromStats,
        })
      : {
          marginUsdt: body.marginUsdt,
          leverage: body.leverage,
          observationHours: body.observationHours,
          exitWeights: body.exitWeights ?? ([0.5, 0.3, 0.2] as [number, number, number]),
          moveSlToBreakevenAfterTp1: body.moveSlToBreakevenAfterTp1 ?? true,
          capLossAtMargin: body.capLossAtMargin ?? false,
          maxRiskPctOfMargin: body.maxRiskPctOfMargin ?? null,
          skipHighRiskSignals: body.skipHighRiskSignals ?? false,
          timeoutTreatment: body.timeoutTreatment ?? "market_close",
          excludeTimeoutsFromStats: body.excludeTimeoutsFromStats ?? false,
        }

    const report = await recomputeBacktestReport(params)

    return NextResponse.json(report)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Recompute failed"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
