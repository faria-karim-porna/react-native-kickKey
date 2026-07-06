// plugins/withNativeFiles.js

const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo config plugin that copies our custom native Kotlin source files
 * and XML resources (e.g. method.xml) from safe project source folders
 * (`src/native/android/`) into the generated `android/` directory during prebuild.
 */
module.exports = function withNativeFiles(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      
      const srcJavaDir = path.join(projectRoot, 'src', 'native', 'android', 'java');
      const srcResDir = path.join(projectRoot, 'src', 'native', 'android', 'res');
      
      const targetJavaDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'java', 'com', 'kickkey');
      const targetResXmlDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res', 'xml');
      const targetResValuesDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res', 'values');

      const copyFile = (src, dest) => {
        const destDir = path.dirname(dest);
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        fs.copyFileSync(src, dest);
        console.log(`[withNativeFiles] Copied ${path.basename(src)} to ${dest}`);
      };

      // 1. Copy Kotlin files
      const kotlinFiles = ['KickKeyApplication.kt', 'KickKeyInputMethodService.kt'];
      kotlinFiles.forEach(file => {
        const srcPath = path.join(srcJavaDir, file);
        const destPath = path.join(targetJavaDir, file);
        if (fs.existsSync(srcPath)) {
          copyFile(srcPath, destPath);
        } else {
          console.warn(`[withNativeFiles] Source file not found: ${srcPath}`);
        }
      });

      // Delete MainApplication.kt if it exists to avoid duplicate/redundant application class declaration
      const mainAppPath = path.join(targetJavaDir, 'MainApplication.kt');
      if (fs.existsSync(mainAppPath)) {
        fs.unlinkSync(mainAppPath);
        console.log('[withNativeFiles] Deleted redundant MainApplication.kt');
      }

      // 2. Copy res/xml/method.xml
      const methodXmlSrc = path.join(srcResDir, 'xml', 'method.xml');
      const methodXmlDest = path.join(targetResXmlDir, 'method.xml');
      if (fs.existsSync(methodXmlSrc)) {
        copyFile(methodXmlSrc, methodXmlDest);
      }

      // 3. Inject strings into strings.xml (instead of overwriting)
      const stringsXmlDest = path.join(targetResValuesDir, 'strings.xml');
      if (fs.existsSync(stringsXmlDest)) {
        let content = fs.readFileSync(stringsXmlDest, 'utf8');
        if (!content.includes('name="ime_name"')) {
          content = content.replace(
            '</resources>',
            '    <string name="ime_name">KickKey Keyboard</string>\n</resources>'
          );
          fs.writeFileSync(stringsXmlDest, content, 'utf8');
          console.log('[withNativeFiles] Added ime_name string to strings.xml');
        }
      }

      return config;
    }
  ]);
};
