const fs = require('node:fs');
const path = require('node:path');

const settingsPath = path.join(
  __dirname,
  '..',
  'node_modules',
  '@react-native',
  'gradle-plugin',
  'settings.gradle.kts',
);

const incompatibleFoojayLine =
  'plugins { id("org.gradle.toolchains.foojay-resolver-convention").version("0.5.0") }';
const gradle9CompatibleFoojayLine =
  'plugins { id("org.gradle.toolchains.foojay-resolver-convention").version("1.0.0") }';

if (!fs.existsSync(settingsPath)) {
  throw new Error(`React Native Gradle plugin settings file not found: ${settingsPath}`);
}

const settings = fs.readFileSync(settingsPath, 'utf8');
if (settings.includes(gradle9CompatibleFoojayLine)) {
  process.exit(0);
}

if (!settings.includes(incompatibleFoojayLine)) {
  throw new Error('Unexpected React Native Gradle plugin Foojay resolver configuration.');
}

fs.writeFileSync(
  settingsPath,
  settings.replace(incompatibleFoojayLine, gradle9CompatibleFoojayLine),
);
