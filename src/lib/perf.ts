/**
 * Lightweight performance instrumentation.
 * Logs FCP, LCP, TTFB and slow network requests to console.
 */
export function initPerfObserver() {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

  // Paint metrics (FCP)
  try {
    const paintObs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.log(`[Perf] ${entry.name}: ${Math.round(entry.startTime)}ms`);
      }
    });
    paintObs.observe({ type: 'paint', buffered: true });
  } catch {}

  // LCP
  try {
    const lcpObs = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (last) console.log(`[Perf] LCP: ${Math.round(last.startTime)}ms`);
    });
    lcpObs.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {}

  // Navigation (TTFB)
  try {
    const navObs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const nav = entry as PerformanceNavigationTiming;
        console.log(`[Perf] TTFB: ${Math.round(nav.responseStart - nav.requestStart)}ms`);
        console.log(`[Perf] DOM Interactive: ${Math.round(nav.domInteractive)}ms`);
        console.log(`[Perf] DOM Complete: ${Math.round(nav.domComplete)}ms`);
      }
    });
    navObs.observe({ type: 'navigation', buffered: true });
  } catch {}

  // Slow resource requests (>1s)
  try {
    const resObs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const res = entry as PerformanceResourceTiming;
        const duration = res.responseEnd - res.startTime;
        if (duration > 1000) {
          console.warn(`[Perf] Slow resource (${Math.round(duration)}ms): ${res.name.split('/').pop()}`);
        }
      }
    });
    resObs.observe({ type: 'resource', buffered: false });
  } catch {}
}
