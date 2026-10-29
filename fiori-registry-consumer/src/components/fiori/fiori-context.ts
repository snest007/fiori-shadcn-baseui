import { createContext, useContext } from "react"

export type FioriDensity = "compact" | "cozy"

export const FioriContext = createContext<{
  density: FioriDensity
  portalContainer: HTMLElement | null
} | null>(null)

/** Keep overlay tokens and fonts inside their owning Fiori region. */
export function useFioriPortalContainer() {
  return useContext(FioriContext)?.portalContainer ?? undefined
}
