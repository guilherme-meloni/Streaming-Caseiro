import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.guilherme.canalnostalgia',
  appName: 'Canal Nostalgia',
  webDir: 'build',
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
  },
  // Configuration for the community Electron platform
  electron: {
    // Where to place the bundled electron app
    bundler: "electron-builder",
    // Custom scheme for the app
    customUrlScheme: "capacitor-electron",
    // Electron-builder configuration
    builderOptions: {
      appId: "com.guilherme.canalnostalgia.desktop",
      productName: "Canal Nostalgia",
      // Files to include in the build
      files: [
        "build/",
        "electron/",
        "package.json"
      ],
      linux: {
        target: [
          "pacman",
          "AppImage"
        ],
        category: "Utility"
      }
    }
  }
};

export default config;