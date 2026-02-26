import { createContext, useContext } from 'react';

/**
 * Context that provides a portal container element.
 * On desktop, this points to the mobile frame's inner div so that
 * portaled overlays (sheets, navs) stay inside the phone container.
 * On mobile, it falls back to document.body.
 */
const PortalContainerContext = createContext<HTMLElement | null>(null);

export const PortalContainerProvider = PortalContainerContext.Provider;

export function usePortalContainer(): HTMLElement {
  const container = useContext(PortalContainerContext);
  return container || document.body;
}
