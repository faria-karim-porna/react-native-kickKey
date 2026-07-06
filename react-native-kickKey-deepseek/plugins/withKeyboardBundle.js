// plugins/withKeyboardBundle.js
const { withDangerousMod } = require('@expo/config-plugins');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Expo config plugin that builds the keyboard-only JS bundle (keyboard.bundle)
 * into android/app/src/main/assets/ alongside the main companion app bundle.
 *
 * Uses `npx metro build` (Expo SDK 57+) instead of the deprecated
 * `npx react-native bundle`.
 *
 * This runs during `expo prebuild` and `eas build`.
 */
module.exports = function withKeyboardBundle(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const assetsDir = path.join(
        projectRoot,
        'android',
        'app',
        'src',
        'main',
        'assets'
      );

      // Ensure assets directory exists
      if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
      }

      // Metro build appends .js extension, so we output to a temp path
      // then rename to remove the extra extension
      const tempOutputPath = path.join(assetsDir, 'keyboard.bundle.js');
      const finalOutputPath = path.join(assetsDir, 'keyboard.bundle');

      console.log('[withKeyboardBundle] Building keyboard.bundle...');

      try {
        execSync(
          [
            'npx metro build',
            'keyboard.index.js',
            `--out "${tempOutputPath}"`,
            '--platform android',
            '--dev false',
          ].join(' '),
          {
            cwd: projectRoot,
            stdio: 'inherit',
            env: { ...process.env, NODE_ENV: 'production' },
          }
        );

        // Rename to remove the .js extension that metro adds
        if (fs.existsSync(tempOutputPath)) {
          fs.renameSync(tempOutputPath, finalOutputPath);
        }

        console.log('[withKeyboardBundle] keyboard.bundle built successfully');
      } catch (error) {
        console.error('[withKeyboardBundle] Failed to build keyboard.bundle:', error.message);
        // Don't throw — allow prebuild to continue; bundle may already exist
        // If it does, check if it's stale and warn
        if (fs.existsSync(finalOutputPath)) {
          const stats = fs.statSync(finalOutputPath);
          console.warn(`[withKeyboardBundle] Using existing keyboard.bundle (${(stats.size / 1024).toFixed(1)} KB)`);
        }
      }

      return config;
    },
  ]);
};
