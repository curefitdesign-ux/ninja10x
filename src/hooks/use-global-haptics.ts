import { useEffect } from 'react';
import { triggerHaptic } from '@/hooks/use-haptic-feedback';

/**
 * Global haptic feedback — triggers vibration on every tap
 * of interactive elements (buttons, links, tabs, etc.)
 * Attach once at app root level.
 */
export function useGlobalHaptics() {
  useEffect(() => {
    const handleTap = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

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
        || window.getComputedStyle(target).cursor === 'pointer'
        || target.closest('[class*="cursor-pointer"]')
        || target.closest('[class*="active:scale"]');

      if (isInteractive) {
        triggerHaptic('light');
      }
    };

    document.addEventListener('pointerdown', handleTap, { passive: true });
    return () => document.removeEventListener('pointerdown', handleTap);
  }, []);
}
