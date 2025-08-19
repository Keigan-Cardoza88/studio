import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.readysetplay.app',
  appName: 'ReadySetPlay 2.0',
  webDir: 'out',
  server: {
    hostname: 'localhost',
    androidScheme: 'https'
  }
};

export default config;
