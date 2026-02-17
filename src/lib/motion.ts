/**
 * Auto-motion: automatically adds "is-in" to .motion-in, .stagger, .overlay-fade
 * elements as they appear in the DOM, triggering CSS transitions.
 */
export function enableAutoMotion(): () => void {
  const activate = (el: HTMLElement) => {
    // Small RAF delay so the browser paints the "before" state first
    requestAnimationFrame(() => el.classList.add("is-in"));
  };

  const selectors = ".motion-in, .stagger, .overlay-fade";

  // Mark existing nodes
  document.querySelectorAll<HTMLElement>(selectors).forEach(activate);

  // Animate future nodes
  const obs = new MutationObserver((mutations) => {
    for (const m of mutations) {
      m.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        if (node.matches?.(selectors)) activate(node);
        node.querySelectorAll?.<HTMLElement>(selectors).forEach(activate);
      });
    }
  });

  obs.observe(document.body, { childList: true, subtree: true });
  return () => obs.disconnect();
}
