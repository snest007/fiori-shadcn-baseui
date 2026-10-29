"use client"

import { useMemo, useState, type ComponentProps } from "react"
import { FioriContext, type FioriDensity } from "./fiori-context"
import "@/styles/fiori-scoped.css"

export type FioriProviderProps = Omit<ComponentProps<"div">, "ref"> & {
  /** Phones below 600 CSS px always use Cozy sizing. */
  density?: FioriDensity
}

export function FioriProvider({
  density = "compact",
  children,
  ...props
}: FioriProviderProps) {
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null)
  const environment = useMemo(
    () => ({ density, portalContainer }),
    [density, portalContainer]
  )
  return (
    <FioriContext.Provider value={environment}>
      <div
        {...props}
        ref={setPortalContainer}
        data-fiori-root=""
        data-fiori-density={density}
      >
        {children}
      </div>
    </FioriContext.Provider>
  )
}
