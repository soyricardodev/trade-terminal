"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface RegisterTradeBarProps {
  canRegister: boolean
  onRegister: () => void
  className?: string
}

export function RegisterTradeBar({
  canRegister,
  onRegister,
  className,
}: RegisterTradeBarProps) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 z-40 border-t border-border bg-surface/95 backdrop-blur-md",
        "bottom-14 pb-safe md:bottom-14 lg:bottom-0 lg:pb-0",
        className,
      )}
    >
      <div className="mx-auto max-w-[1600px] px-4 py-2 lg:px-8">
        <Button
          type="button"
          className={cn(
            "h-11 w-full text-sm font-semibold",
            canRegister && "shadow-[0_0_24px_rgba(240,185,11,0.15)]",
          )}
          onClick={onRegister}
          disabled={!canRegister}
        >
          Register trade
        </Button>
        {!canRegister && (
          <p className="mt-1 text-center text-[10px] text-muted-foreground">
            Set entry, margin, leverage, and TP/SL to enable
          </p>
        )}
      </div>
    </div>
  )
}
