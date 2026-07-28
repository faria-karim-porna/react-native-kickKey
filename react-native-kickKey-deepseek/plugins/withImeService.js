// plugins/withImeService.js
const { withAndroidManifest, withDangerousMod, withStringsXml, AndroidConfig } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo config plugin that:
 * 1. Copies custom Kotlin source files and resources into android/ app directory during prebuild.
 * 2. Registers KickKeyInputMethodService as an Android IME.
 * 3. Sets KickKeyApplication as the Application class and adds VIBRATE permission.
 * 4. Fixes any Groovy build.gradle syntax issues.
 */
function withNativeSourceCopy(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const nativeFilesDir = path.join(projectRoot, 'native-files');

      // 1. Copy Kotlin files
      const srcJavaDir = path.join(nativeFilesDir, 'java', 'com', 'kickkey');
      const targetJavaDir = path.join(
        projectRoot,
        'android',
        'app',
        'src',
        'main',
        'java',
        'com',
        'kickkey'
      );

      if (fs.existsSync(srcJavaDir)) {
        fs.mkdirSync(targetJavaDir, { recursive: true });
        const files = fs.readdirSync(srcJavaDir);
        for (const file of files) {
          fs.copyFileSync(
            path.join(srcJavaDir, file),
            path.join(targetJavaDir, file)
          );
        }
        console.log(`[withImeService] Copied ${files.length} Kotlin files to ${targetJavaDir}`);
      }

      // 2. Copy method.xml
      const srcXmlFile = path.join(nativeFilesDir, 'res', 'xml', 'method.xml');
      const targetXmlDir = path.join(
        projectRoot,
        'android',
        'app',
        'src',
        'main',
        'res',
        'xml'
      );

      if (fs.existsSync(srcXmlFile)) {
        fs.mkdirSync(targetXmlDir, { recursive: true });
        fs.copyFileSync(srcXmlFile, path.join(targetXmlDir, 'method.xml'));
        console.log('[withImeService] Copied method.xml');
      }

      // 3. Copy dictionary binary files
      const srcDictDir = path.join(projectRoot, 'assets', 'dictionaries');
      const targetDictDir = path.join(
        projectRoot,
        'android',
        'app',
        'src',
        'main',
        'assets',
        'dictionaries'
      );

      if (fs.existsSync(srcDictDir)) {
        fs.mkdirSync(targetDictDir, { recursive: true });
        for (const file of ['english.bin', 'bangla.bin']) {
          const srcBin = path.join(srcDictDir, file);
          if (fs.existsSync(srcBin)) {
            fs.copyFileSync(srcBin, path.join(targetDictDir, file));
            console.log(`[withImeService] Copied ${file} to assets/dictionaries`);
          }
        }
      }

      // 4. Fix build.gradle if tasks.withType<Test> is present
      const buildGradlePath = path.join(projectRoot, 'android', 'app', 'build.gradle');
      if (fs.existsSync(buildGradlePath)) {
        let content = fs.readFileSync(buildGradlePath, 'utf8');
        if (content.includes('tasks.withType<Test>')) {
          content = content.replace('tasks.withType<Test>', 'tasks.withType(Test)');
          fs.writeFileSync(buildGradlePath, content, 'utf8');
          console.log('[withImeService] Fixed tasks.withType in android/app/build.gradle');
        }
      }

      return config;
    },
  ]);
}

module.exports = function withImeService(config) {
  // First apply native source copy
  config = withNativeSourceCopy(config);

  // Apply strings.xml updates for ime_name
  config = withStringsXml(config, (config) => {
    config.modResults = AndroidConfig.Strings.setStringItem(
      [
        {
          $: { name: 'ime_name' },
          _: 'KickKey Keyboard',
        },
      ],
      config.modResults
    );
    return config;
  });

  // Then apply manifest updates
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
          'android:process': ':ime_process', // separate process
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

    // 3. Add VIBRATE permission
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
