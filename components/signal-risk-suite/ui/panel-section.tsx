import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

interface PanelSectionProps {
  title?: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  collapsible?: boolean
  defaultOpen?: boolean
}

export function PanelSection({
  title,
  description,
  action,
  children,
  className,
}: PanelSectionProps) {
  return (
    <section
      className={cn(
        "border border-border bg-surface",
        className,
      )}
    >
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 border-b border-border px-3 py-2.5">
          <div className="min-w-0">
            {title && (
              <h2 className="text-sm font-medium text-foreground">{title}</h2>
            )}
            {description && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {action}
        </header>
      )}
      <div className="p-3">{children}</div>
    </section>
  )
}
