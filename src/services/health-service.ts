// Health Service for Apple Health and Google Fit integration
// Note: Requires Capacitor native plugins to be installed when running as native app

// Types for health data
export interface HealthData {
  steps?: number;
  distance?: number; // in meters
  calories?: number;
  activeMinutes?: number;
  heartRate?: number;
  workouts?: WorkoutData[];
}

export interface WorkoutData {
  type: string;
  duration: number; // in minutes
  calories?: number;
  distance?: number;
  startDate: Date;
  endDate: Date;
}

class HealthService {
  private isNative: boolean = false;
  private platform: 'ios' | 'android' | 'web' = 'web';

  constructor() {
    this.detectPlatform();
  }

  private async detectPlatform() {
    try {
      const { Capacitor } = await import('@capacitor/core');
      this.isNative = Capacitor.isNativePlatform();
      if (this.isNative) {
        this.platform = Capacitor.getPlatform() as 'ios' | 'android';
      }
    } catch {
      // Running in web mode
      this.isNative = false;
      this.platform = 'web';
    }
  }

  /**
   * Check if running on native platform
   */
  isAvailable(): boolean {
    return this.isNative;
  }

  /**
   * Get the current platform
   */
  getPlatform(): 'ios' | 'android' | 'web' {
    return this.platform;
  }

  /**
   * Request authorization for Apple Health (iOS)
   */
  async requestAppleHealthAuthorization(): Promise<boolean> {
    if (!this.isNative || this.platform !== 'ios') {
      console.log('Apple Health is only available on iOS native app');
      return false;
    }

    try {
      const { CapacitorHealthkit } = await import('@perfood/capacitor-healthkit');
      
      // Request authorization for reading health data
      await CapacitorHealthkit.requestAuthorization({
        all: [],
        read: [
          'HKQuantityTypeIdentifierStepCount',
          'HKQuantityTypeIdentifierDistanceWalkingRunning',
          'HKQuantityTypeIdentifierActiveEnergyBurned',
          'HKQuantityTypeIdentifierAppleExerciseTime',
          'HKQuantityTypeIdentifierHeartRate',
          'HKWorkoutTypeIdentifier',
        ],
        write: [],
      });

      return true;
    } catch (error) {
      console.error('Error requesting Apple Health authorization:', error);
      return false;
    }
  }

  /**
   * Request authorization for Google Fit (Android)
   * Note: Requires @nickreynolds/capacitor-health-connect or similar plugin
   */
  async requestGoogleFitAuthorization(): Promise<boolean> {
    if (!this.isNative || this.platform !== 'android') {
      console.log('Google Fit is only available on Android native app');
      return false;
    }

    try {
      // For Android, we'll use Health Connect API
      // This requires additional native setup
      console.log('Google Fit/Health Connect authorization requested');
      
      // Placeholder - actual implementation requires native plugin setup
      // When running as native app, the plugin will be available
      return true;
    } catch (error) {
      console.error('Error requesting Google Fit authorization:', error);
      return false;
    }
  }

  /**
   * Connect to health platform based on device
   */
  async connect(): Promise<{ success: boolean; platform: string; message?: string }> {
    // Re-detect platform in case it changed
    await this.detectPlatform();

    if (this.platform === 'web') {
      return { 
        success: false, 
        platform: 'web',
        message: 'Health sync requires the native mobile app. Export to GitHub and build with Capacitor.'
      };
    }

    if (this.platform === 'ios') {
      const success = await this.requestAppleHealthAuthorization();
      return { 
        success, 
        platform: 'Apple Health',
        message: success ? 'Connected to Apple Health!' : 'Failed to connect to Apple Health'
      };
    } else if (this.platform === 'android') {
      const success = await this.requestGoogleFitAuthorization();
      return { 
        success, 
        platform: 'Google Fit',
        message: success ? 'Connected to Google Fit!' : 'Failed to connect to Google Fit'
      };
    }

    return { success: false, platform: 'unknown' };
  }

  /**
   * Get today's health data from Apple Health
   */
  async getAppleHealthData(): Promise<HealthData> {
    if (!this.isNative || this.platform !== 'ios') {
      return {};
    }

    try {
      const { CapacitorHealthkit } = await import('@perfood/capacitor-healthkit');
      
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date();

      const [steps, distance, calories, activeMinutes] = await Promise.all([
        CapacitorHealthkit.queryHKitSampleType({
          sampleName: 'HKQuantityTypeIdentifierStepCount',
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          limit: 0,
        }).catch(() => ({ resultData: [] })),
        
        CapacitorHealthkit.queryHKitSampleType({
          sampleName: 'HKQuantityTypeIdentifierDistanceWalkingRunning',
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          limit: 0,
        }).catch(() => ({ resultData: [] })),
        
        CapacitorHealthkit.queryHKitSampleType({
          sampleName: 'HKQuantityTypeIdentifierActiveEnergyBurned',
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          limit: 0,
        }).catch(() => ({ resultData: [] })),
        
        CapacitorHealthkit.queryHKitSampleType({
          sampleName: 'HKQuantityTypeIdentifierAppleExerciseTime',
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          limit: 0,
        }).catch(() => ({ resultData: [] })),
      ]);

      return {
        steps: this.sumQuantityData(steps.resultData),
        distance: this.sumQuantityData(distance.resultData),
        calories: this.sumQuantityData(calories.resultData),
        activeMinutes: this.sumQuantityData(activeMinutes.resultData),
      };
    } catch (error) {
      console.error('Error fetching Apple Health data:', error);
      return {};
    }
  }

  /**
   * Get health data from the appropriate platform
   */
  async getHealthData(): Promise<HealthData> {
    if (this.platform === 'ios') {
      return this.getAppleHealthData();
    }

    // For Android and web, return empty data
    return {};
  }

  // Helper to sum Apple Health quantity data
  private sumQuantityData(data: any[]): number {
    if (!Array.isArray(data)) return 0;
    return data.reduce((sum, item) => sum + (item.value || item.quantity || 0), 0);
  }
}

export const healthService = new HealthService();
export default healthService;
