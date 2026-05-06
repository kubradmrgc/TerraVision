import { AR_UPLOAD_HELP_TEXT, validateArUploadFile } from '../src/features/ar/arUploadValidation';

describe('arUploadValidation', () => {
  it('accepts supported extension and reasonable size', () => {
    const error = validateArUploadFile({
      name: 'sample-model.glb',
      type: 'model/gltf-binary',
      size: 2 * 1024 * 1024
    });
    expect(error).toBeNull();
  });

  it('rejects unsupported extensions', () => {
    const error = validateArUploadFile({
      name: 'asset.zip',
      type: 'application/zip',
      size: 1000
    });
    expect(error).toContain('Desteklenen AR formatlari');
  });

  it('rejects oversized files', () => {
    const error = validateArUploadFile({
      name: 'big-model.usdz',
      type: 'model/vnd.usdz+zip',
      size: 30 * 1024 * 1024
    });
    expect(error).toContain('25MB');
  });

  it('exposes upload help text for UI', () => {
    expect(AR_UPLOAD_HELP_TEXT).toContain('.gltf');
    expect(AR_UPLOAD_HELP_TEXT).toContain('25MB');
  });
});
