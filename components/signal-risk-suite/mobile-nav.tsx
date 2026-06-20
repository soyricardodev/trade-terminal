"use client"

import { IconChartLine, IconNotebook } from "@tabler/icons-react"

import { cn } from "@/lib/utils"

export type MobileTab = "analyze" | "journal"

interface MobileNavProps {
  activeTab: MobileTab
  onTabChange: (tab: MobileTab) => void
  className?: string
}

const tabs: { id: MobileTab; label: string; icon: typeof IconChartLine }[] = [
  { id: "analyze", label: "Analyze", icon: IconChartLine },
  { id: "journal", label: "Journal", icon: IconNotebook },
]

export function MobileNav({ activeTab, onTabChange, className }: MobileNavProps) {
  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur-sm pb-safe md:hidden",
        className,
      )}
      aria-label="Main navigation"
    >
      <div className="flex h-14">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 text-xs transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon
                className="size-5"
                stroke={isActive ? 2 : 1.5}
                aria-hidden
              />
              <span>{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
