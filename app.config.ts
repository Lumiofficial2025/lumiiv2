export default {
  name: "bolt-expo-nativewind",
  slug: "lumiiv2",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "myapp",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  android: {
    package: "com.boltapp.social",
    versionCode: 1,
    permissions: [
      "android.permission.CAMERA",
      "android.permission.RECORD_AUDIO",
      "android.permission.READ_MEDIA_IMAGES",
      "android.permission.READ_EXTERNAL_STORAGE",
      "android.permission.WRITE_EXTERNAL_STORAGE"
    ],
    adaptiveIcon: {
      foregroundImage: "./assets/images/icon.png",
      backgroundColor: "#FF3050"
    }
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.boltapp.social"
  },
  web: {
    bundler: "metro"
  },
  plugins: ["expo-router"],
  experiments: {
    typedRoutes: true
  },
  extra: {
    router: {
      origin: false
    },
    eas: {
      projectId: "dd8c12cc-3f96-46fb-be5f-89180a3b84e6" // ✅ From your screenshot
    }
  },
  owner: "jsaldana25" // ✅ Your Expo username
};
