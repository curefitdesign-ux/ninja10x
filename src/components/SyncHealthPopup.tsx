import { useEffect, useState } from 'react';
import { Smartphone, Loader2, Activity, Watch } from 'lucide-react';
import { healthService, HealthData } from '@/services/health-service';
import { triggerHaptic } from '@/hooks/use-haptic-feedback';

interface SyncHealthPopupProps {
  onClose: () => void;
  isConnecting: boolean;
  setIsConnecting: (val: boolean) => void;
  healthConnected: string | null;
  setHealthConnected: (val: string | null) => void;
}

const SyncHealthPopup = ({
  onClose,
  isConnecting,
  setIsConnecting,
  healthConnected,
  setHealthConnected,
}: SyncHealthPopupProps) => {
  const [detectedDevice, setDetectedDevice] = useState<'ios' | 'android' | 'unknown'>('unknown');
  const [isDetecting, setIsDetecting] = useState(true);
  const [syncedData, setSyncedData] = useState<HealthData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Detect device on mount
  useEffect(() => {
    const detectDevice = async () => {
      setIsDetecting(true);
      await healthService.ensureDetected();
      const device = healthService.getDetectedDevice();
      setDetectedDevice(device);
      setIsDetecting(false);
    };
    detectDevice();
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    setErrorMessage(null);
    triggerHaptic('light');

    const result = await healthService.connect();

    if (result.success) {
      setHealthConnected(result.platform);
      triggerHaptic('success');

      // Fetch health data after successful connection
      const data = await healthService.getHealthData();
      if (data && (data.steps || data.calories || data.distance)) {
        setSyncedData(data);
      }
    } else {
      setErrorMessage(result.message || 'Failed to connect');
      triggerHaptic('error');
    }

    setIsConnecting(false);
  };

  const deviceConfig = {
    ios: {
      name: 'Apple Health',
      subtitle: 'Sync with iPhone & Apple Watch',
      gradient: 'from-pink-500 to-red-500',
      icon: '❤️',
    },
    android: {
      name: 'Google Fit',
      subtitle: 'Sync with Android & Wear OS',
      gradient: 'from-green-500 to-blue-500',
      icon: '💚',
    },
  };

  const currentDevice = detectedDevice !== 'unknown' ? deviceConfig[detectedDevice] : null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 backdrop-blur-md bg-black/70"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-300">
        <div className="bg-white/10 backdrop-blur-2xl border-t border-white/20 rounded-t-3xl p-6 pb-10">
          <div className="w-10 h-1 bg-white/30 rounded-full mx-auto mb-6" />

          <div className="flex items-center gap-3 mb-4">
            <Smartphone className="w-6 h-6 text-white" />
            <h3 className="text-white text-xl font-semibold">Connect Health Data</h3>
          </div>

          {/* Detecting device */}
          {isDetecting ? (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="w-10 h-10 text-white animate-spin mb-4" />
              <p className="text-white/70 text-sm">Detecting your device...</p>
            </div>
          ) : (
            <>
              {/* Connected status with synced data */}
              {healthConnected && (
                <div className="mb-4 p-4 bg-green-500/20 rounded-xl border border-green-500/30">
                  <p className="text-green-400 text-sm font-medium mb-2">
                    ✓ Connected to {healthConnected}
                  </p>
                  {syncedData && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {syncedData.steps !== undefined && (
                        <div className="text-center">
                          <p className="text-white text-lg font-bold">{syncedData.steps.toLocaleString()}</p>
                          <p className="text-white/60 text-xs">Steps</p>
                        </div>
                      )}
                      {syncedData.calories !== undefined && (
                        <div className="text-center">
                          <p className="text-white text-lg font-bold">{Math.round(syncedData.calories)}</p>
                          <p className="text-white/60 text-xs">Cal</p>
                        </div>
                      )}
                      {syncedData.distance !== undefined && (
                        <div className="text-center">
                          <p className="text-white text-lg font-bold">{(syncedData.distance / 1000).toFixed(1)}</p>
                          <p className="text-white/60 text-xs">km</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Error message */}
              {errorMessage && !healthConnected && (
                <div className="mb-4 p-3 bg-orange-500/20 rounded-xl border border-orange-500/30">
                  <p className="text-orange-400 text-sm">{errorMessage}</p>
                </div>
              )}

              {/* Device-specific option */}
              {currentDevice && !healthConnected && (
                <>
                  <p className="text-white/70 text-sm mb-4">
                    We detected you're using {detectedDevice === 'ios' ? 'an iOS' : 'an Android'} device.
                  </p>
                  <button
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="w-full flex items-center gap-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-2xl p-4 transition-colors disabled:opacity-50"
                  >
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${currentDevice.gradient} flex items-center justify-center`}>
                      {isConnecting ? (
                        <Loader2 className="w-7 h-7 text-white animate-spin" />
                      ) : (
                        <span className="text-white text-3xl">{currentDevice.icon}</span>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="text-white font-semibold text-lg">{currentDevice.name}</h4>
                      <p className="text-white/60 text-sm">{currentDevice.subtitle}</p>
                    </div>
                    <Watch className="w-5 h-5 text-white/40" />
                  </button>
                </>
              )}

              {/* Unknown device - show both options */}
              {detectedDevice === 'unknown' && !healthConnected && (
                <>
                  <p className="text-white/70 text-sm mb-4">
                    Choose your health platform to sync fitness data.
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={handleConnect}
                      disabled={isConnecting}
                      className="w-full flex items-center gap-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-2xl p-4 transition-colors disabled:opacity-50"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center">
                        {isConnecting ? (
                          <Loader2 className="w-6 h-6 text-white animate-spin" />
                        ) : (
                          <span className="text-white text-2xl">❤️</span>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <h4 className="text-white font-semibold">Apple Health</h4>
                        <p className="text-white/60 text-sm">For iPhone & Apple Watch</p>
                      </div>
                    </button>
                    <button
                      onClick={handleConnect}
                      disabled={isConnecting}
                      className="w-full flex items-center gap-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-2xl p-4 transition-colors disabled:opacity-50"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center">
                        {isConnecting ? (
                          <Loader2 className="w-6 h-6 text-white animate-spin" />
                        ) : (
                          <span className="text-white text-2xl">💚</span>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <h4 className="text-white font-semibold">Google Fit</h4>
                        <p className="text-white/60 text-sm">For Android & Wear OS</p>
                      </div>
                    </button>
                  </div>
                </>
              )}

              {/* Sync data button when connected */}
              {healthConnected && (
                <button
                  onClick={async () => {
                    setIsConnecting(true);
                    triggerHaptic('light');
                    const data = await healthService.getHealthData();
                    if (data && (data.steps || data.calories || data.distance)) {
                      setSyncedData(data);
                      triggerHaptic('success');
                    }
                    setIsConnecting(false);
                  }}
                  disabled={isConnecting}
                  className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-2xl p-4 transition-colors disabled:opacity-50 mt-3"
                >
                  {isConnecting ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <Activity className="w-5 h-5 text-white" />
                  )}
                  <span className="text-white font-medium">Sync Latest Data</span>
                </button>
              )}
            </>
          )}

          <button
            onClick={onClose}
            className="mt-6 mx-auto px-8 py-2 flex items-center justify-center rounded-full bg-white/20"
          >
            <span className="text-white font-semibold text-sm">
              {healthConnected ? 'Done' : 'Maybe Later'}
            </span>
          </button>
        </div>
      </div>
    </>
  );
};

export default SyncHealthPopup;
