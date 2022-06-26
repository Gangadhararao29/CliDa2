import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.app.clida',
  appName: 'CliDa',
  webDir: 'www',
  bundledWebRuntime: false,

  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#999999',
      splashFullScreen: false,
      splashImmersive: false,
      layoutName: 'launch_screen',
      useDialog: false,
    },
  },
};

export default config;
