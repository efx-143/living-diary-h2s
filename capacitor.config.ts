import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sanyam.livingdiary',
  appName: 'living-diary',
  webDir: 'build',
  // --- ADD/MODIFY THIS ANDROID BLOCK ---
  android: {
    permissions: [
      {
        alias: 'storage',
        name: 'android.permission.READ_EXTERNAL_STORAGE'
      }
    ]
  }
};

export default config;