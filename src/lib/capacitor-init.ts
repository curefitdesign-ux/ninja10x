import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

/**
 * Initialize Capacitor plugins for native app experience
 * - Makes status bar transparent so content extends behind it
 * - Sets status bar text to light for dark backgrounds
 */
export async function initCapacitor() {
  if (!Capacitor.isNativePlatform()) {
    console.log('Running in web mode - skipping native status bar config');
    return;
  }

  try {
    // Make status bar overlay the webview (content goes behind)
    await StatusBar.setOverlaysWebView({ overlay: true });
    
    // Set light text for dark backgrounds
    await StatusBar.setStyle({ style: Style.Dark });
    
    // Make status bar background transparent
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({ color: '#00000000' });
    }
    
    console.log('Capacitor status bar configured for edge-to-edge');
  } catch (error) {
    console.warn('Failed to configure status bar:', error);
  }
}

/**
 * Check if running as a native app
 */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Get the current platform
 */
export function getPlatform(): 'ios' | 'android' | 'web' {
  return Capacitor.getPlatform() as 'ios' | 'android' | 'web';
}
