import { getPalette, getOrderStatusLabel } from '../src/theme/mobileTheme';

describe('mobileTheme', () => {
  it('returns expected light and dark palette keys', () => {
    const light = getPalette('light');
    const dark = getPalette('dark');

    expect(light.bg).toBe('#f4f4f5');
    expect(dark.bg).toBe('#0f172a');
    expect(light.button).toBe('#166534');
    expect(dark.button).toBe('#86efac');
  });

  it('resolves known and unknown order statuses', () => {
    expect(getOrderStatusLabel(1)).toBe('Pending');
    expect(getOrderStatusLabel(99)).toBe('Unknown(99)');
  });
});
