// Haptic feedback patterns for different interactions
type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error';

const HAPTIC_PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 20],
  error: [50, 30, 50, 30, 50],
};

export const useHapticFeedback = () => {
  const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  const trigger = (pattern: HapticPattern = 'light') => {
    if (!isSupported) return;
    
    try {
      navigator.vibrate(HAPTIC_PATTERNS[pattern]);
    } catch (error) {
      // Silently fail if vibration is not allowed
      console.debug('Haptic feedback not available');
    }
  };

  return { trigger, isSupported };
};

// Standalone function for components that don't need the hook
export const triggerHaptic = (pattern: HapticPattern = 'light') => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(HAPTIC_PATTERNS[pattern]);
    } catch (error) {
      // Silently fail
    }
  }
};
