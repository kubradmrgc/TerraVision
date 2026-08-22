import { resolveMediaPublicUrl } from '../src/services/mediaPublicUrl';

jest.mock('../src/config/env', () => ({
  API_BASE_URL: 'http://10.0.0.5:5090'
}));

describe('resolveMediaPublicUrl', () => {
  it('prefixes relative asset paths with API base', () => {
    expect(resolveMediaPublicUrl('/assets/exchange-images/x.jpg')).toBe(
      'http://10.0.0.5:5090/assets/exchange-images/x.jpg'
    );
  });

  it('leaves absolute https URLs unchanged', () => {
    const url = 'https://cdn.example.com/a.jpg';
    expect(resolveMediaPublicUrl(url)).toBe(url);
  });
});
