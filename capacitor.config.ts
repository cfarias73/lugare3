import type { CapacitorConfig } from '@capacitor/cli';

const target = process.env.CAP_TARGET || 'user';

const commonConfig = {
  webDir: 'dist',
  server: {
    androidScheme: 'https' as const,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
    },
  },
};

const userConfig: CapacitorConfig = {
  appId: 'com.lugare.user',
  appName: 'Lugare',
  ...commonConfig,
  ios: { path: 'ios-user' },
  android: { path: 'android-user' },
};

const hostConfig: CapacitorConfig = {
  appId: 'com.lugare.host',
  appName: 'Lugare',
  ...commonConfig,
  ios: { path: 'ios-host' },
  android: { path: 'android-host' },
};

export default target === 'host' ? hostConfig : userConfig;
