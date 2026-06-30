const fs = require('fs');
const path = require('path');

const settingsPath = path.join(
  __dirname,
  '..',
  'node_modules',
  '@react-native',
  'gradle-plugin',
  'settings.gradle.kts'
);

if (!fs.existsSync(settingsPath)) {
  console.warn('[postinstall] React Native Gradle plugin settings file not found; skipping patch.');
  process.exit(0);
}

const incompatibleFoojayPlugin =
  'plugins { id("org.gradle.toolchains.foojay-resolver-convention").version("0.5.0") }';
const contents = fs.readFileSync(settingsPath, 'utf8');

if (!contents.includes(incompatibleFoojayPlugin)) {
  console.log('[postinstall] React Native Gradle plugin already patched.');
  process.exit(0);
}

fs.writeFileSync(settingsPath, contents.replace(`${incompatibleFoojayPlugin}\n\n`, ''), 'utf8');
console.log('[postinstall] Removed incompatible Foojay resolver from React Native Gradle plugin.');
