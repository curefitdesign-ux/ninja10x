import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.19529fd9c1764df285fdb08b2ab3d4a5',
  appName: 'ninja-10x',
  webDir: 'dist',
  server: {
    url: 'https://19529fd9-c176-4df2-85fd-b08b2ab3d4a5.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  ios: {
    contentInset: 'always',
    backgroundColor: '#252535',
  },
  android: {
    backgroundColor: '#252535',
  },
};

export default config;
