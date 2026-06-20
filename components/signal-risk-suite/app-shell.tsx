import type { ReactNode } from "react"



import { Badge } from "@/components/ui/badge"

import { cn } from "@/lib/utils"



interface AppShellProps {

  children: ReactNode

  pairSelector?: ReactNode

  direction?: "LONG" | "SHORT"

  mobileNav?: ReactNode

  desktopTabs?: ReactNode

}



export function AppShell({

  children,

  pairSelector,

  direction,

  mobileNav,

  desktopTabs,

}: AppShellProps) {

  return (

    <div className="flex min-h-svh min-w-0 flex-col overflow-x-clip bg-background">

      <header className="sticky top-0 z-30 border-b border-border bg-surface/95 pt-safe backdrop-blur-sm">

        <div className="mx-auto flex h-12 max-w-[1600px] min-w-0 items-center justify-between gap-2 px-4 lg:gap-3 lg:px-8">

          <div className="flex min-w-0 items-center gap-2.5">

            <div

              className="flex size-7 shrink-0 items-center justify-center bg-primary text-xs font-bold text-primary-foreground"

              aria-hidden

            >

              TT

            </div>

            <div className="min-w-0">

              <p className="truncate text-sm font-semibold leading-none">

                Trade Terminal

              </p>

              <p className="mt-0.5 hidden text-xs text-muted-foreground sm:block">

                VIP parser · 50/30/20 risk · local journal

              </p>

            </div>

          </div>



          <div className="flex min-w-0 shrink items-center gap-2 overflow-hidden">

            {pairSelector}

            {direction && (

              <Badge

                variant="outline"

                className={cn(

                  "text-xs",

                  direction === "LONG"

                    ? "border-long/40 text-long"

                    : "border-short/40 text-short",

                )}

              >

                {direction}

              </Badge>

            )}

          </div>



          {desktopTabs && (

            <div className="hidden md:block">{desktopTabs}</div>

          )}

        </div>

      </header>



      <main className="mx-auto w-full min-w-0 max-w-[1600px] flex-1 overflow-x-clip px-4 py-3 lg:px-8">

        {children}

      </main>



      {mobileNav}

    </div>

  )

}

