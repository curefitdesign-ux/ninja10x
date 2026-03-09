import { WebHaptics, defaultPatterns } from 'web-haptics';

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error';

const haptics = new WebHaptics();

const PATTERN_MAP: Record<HapticPattern, (typeof defaultPatterns)[keyof typeof defaultPatterns]> = {
  light: defaultPatterns.selection,
  medium: defaultPatterns.medium,
  heavy: defaultPatterns.heavy,
  success: defaultPatterns.success,
  error: defaultPatterns.error,
};

// Hook for React components
export const useHapticFeedback = () => {
  const trigger = (pattern: HapticPattern = 'light') => {
    try {
      haptics.trigger(PATTERN_MAP[pattern]);
    } catch {
      // Silently fail on unsupported devices
    }
  };
  return { trigger, isSupported: true };
};

// Standalone function — use anywhere
export const triggerHaptic = (pattern: HapticPattern = 'light') => {
  try {
    haptics.trigger(PATTERN_MAP[pattern]);
  } catch {}
};
