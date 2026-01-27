import { useState, useEffect } from 'react';

const DEVICE_ID_KEY = 'device_unique_id';

/**
 * Generates a unique device identifier and persists it in localStorage.
 * This ID remains constant across sessions for the same device/browser.
 */
function generateDeviceId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  const randomPart2 = Math.random().toString(36).substring(2, 15);
  return `device_${timestamp}_${randomPart}${randomPart2}`;
}

export function getDeviceId(): string {
  try {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = generateDeviceId();
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  } catch {
    // Fallback for environments where localStorage is not available
    return generateDeviceId();
  }
}

export function useDeviceId(): string {
  const [deviceId, setDeviceId] = useState<string>('');

  useEffect(() => {
    setDeviceId(getDeviceId());
  }, []);

  return deviceId;
}

/**
 * Get the storage key for photos based on device ID
 */
export function getPhotosStorageKey(): string {
  const deviceId = getDeviceId();
  return `activity_photos_${deviceId}`;
}
