import { useEffect } from 'react';
import { WebHaptics } from 'web-haptics';

const haptics = new WebHaptics();

/**
 * Global haptic feedback hook — triggers vibration on every tap
 * of interactive elements (buttons, links, inputs, etc.)
 * Attach once at app root level.
 */
export function useGlobalHaptics() {
  useEffect(() => {
    const handleTap = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Walk up the DOM to find any interactive/tappable ancestor
      const interactiveSelectors = [
        'button',
        'a',
        '[role="button"]',
        '[role="tab"]',
        '[role="menuitem"]',
        '[role="link"]',
        'input[type="checkbox"]',
        'input[type="radio"]',
        'label',
        '[data-haptic]',
      ];

      const isInteractive = target.closest(interactiveSelectors.join(','))
        || target.style.cursor === 'pointer'
        || window.getComputedStyle(target).cursor === 'pointer'
        || target.closest('[class*="cursor-pointer"]')
        || target.closest('[class*="active:scale"]');

      if (isInteractive) {
        haptics.trigger();
      }
    };

    document.addEventListener('pointerdown', handleTap, { passive: true });
    return () => document.removeEventListener('pointerdown', handleTap);
  }, []);
}
