// plugins/withImeService.js
const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Expo config plugin that registers KickKeyInputMethodService as an Android IME.
 * Also sets KickKeyApplication as the Application class and adds VIBRATE permission.
 */
module.exports = function withImeService(config) {
  return withAndroidManifest(config, async (config) => {
    const manifest = config.modResults.manifest;
    const application = manifest.application?.[0];

    if (!application) {
      throw new Error('withImeService: Could not find <application> in AndroidManifest.xml');
    }

    // 1. Set custom Application class
    application.$['android:name'] = '.KickKeyApplication';

    // 2. Add IME service declaration
    if (!application.service) {
      application.service = [];
    }

    // Check if service already registered (avoid duplicates on repeated prebuild)
    const alreadyRegistered = application.service.some(
      (s) => s.$?.['android:name'] === '.KickKeyInputMethodService'
    );

    if (!alreadyRegistered) {
      application.service.push({
        $: {
          'android:name': '.KickKeyInputMethodService',
          'android:label': '@string/ime_name',
          'android:permission': 'android.permission.BIND_INPUT_METHOD',
          'android:exported': 'true',
          'android:process': ':ime_process',   // ← separate process = memory isolation
        },
        'intent-filter': [
          {
            action: [
              {
                $: { 'android:name': 'android.view.InputMethod' },
              },
            ],
          },
        ],
        'meta-data': [
          {
            $: {
              'android:name': 'android.view.im',
              'android:resource': '@xml/method',
            },
          },
        ],
      });
    }

    // 3. Add VIBRATE permission (for Phase 2 haptic feedback)
    if (!manifest['uses-permission']) {
      manifest['uses-permission'] = [];
    }

    const hasVibrate = manifest['uses-permission'].some(
      (p) => p.$?.['android:name'] === 'android.permission.VIBRATE'
    );

    if (!hasVibrate) {
      manifest['uses-permission'].push({
        $: { 'android:name': 'android.permission.VIBRATE' },
      });
    }

    return config;
  });
};
