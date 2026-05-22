const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

const readProjectFile = (...segments) =>
  fs.readFileSync(path.join(projectRoot, ...segments), 'utf8');

describe('native AR project configuration', () => {
  test('compiles the iOS AR bridge sources into the app target', () => {
    const pbxproj = readProjectFile(
      'ios',
      'TerraVisionNative.xcodeproj',
      'project.pbxproj'
    );

    expect(pbxproj).toMatch(/TerraVisionAr\.swift in Sources/);
    expect(pbxproj).toMatch(/TerraVisionArBridge\.m in Sources/);
  });

  test('keeps the Objective-C bridge as declarations only', () => {
    const bridge = readProjectFile(
      'ios',
      'TerraVisionNative',
      'TerraVisionArBridge.m'
    );

    expect(bridge).toContain('@interface RCT_EXTERN_MODULE(TerraVisionAr, NSObject)');
    expect(bridge).toContain('RCT_EXTERN_METHOD(launchArSession:');
    expect(bridge).not.toMatch(/\+ \(BOOL\)requiresMainQueueSetup[\s\S]*\{/);
  });

  test('declares ARCore package visibility for Android Scene Viewer', () => {
    const manifest = readProjectFile(
      'android',
      'app',
      'src',
      'main',
      'AndroidManifest.xml'
    );

    expect(manifest).toContain('<queries>');
    expect(manifest).toContain('<package android:name="com.google.ar.core" />');
  });
});
