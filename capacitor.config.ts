
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.readysetplay.app',
  appName: 'ReadySetPlay',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
    versionName: '1.0.1', // A user-visible version name
    versionCode: 2,      // An incremental version number for updates
  },
};

export default config;
