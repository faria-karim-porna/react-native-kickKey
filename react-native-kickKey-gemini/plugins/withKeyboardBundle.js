// plugins/withKeyboardBundle.js

const { withDangerousMod } = require('@expo/config-plugins');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Expo config plugin that builds the keyboard-only JS bundle (keyboard.bundle)
 * into android/app/src/main/assets/ alongside the main companion app bundle.
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

      const outputPath = path.join(assetsDir, 'keyboard.bundle');

      console.log('[withKeyboardBundle] Building keyboard.bundle...');

      try {
        // Use Expo CLI's export:embed which is stable and avoids CLI dependency issues
        execSync(
          [
            'npx expo export:embed',
            '--entry-file keyboard.index.js',
            `--bundle-output "${outputPath}"`,
            '--platform android',
            '--minify true',
            '--reset-cache',
          ].join(' '),
          {
            cwd: projectRoot,
            stdio: 'inherit',
            env: { ...process.env, NODE_ENV: 'production' },
          }
        );
        console.log('[withKeyboardBundle] keyboard.bundle built successfully');
      } catch (error) {
        console.error('[withKeyboardBundle] Failed to build keyboard.bundle:', error.message);
        // Don't throw — allow prebuild to continue; bundle may already exist
      }

      return config;
    },
  ]);
};
