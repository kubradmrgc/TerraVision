import { getPalette, getOrderStatusLabel } from '../src/theme/mobileTheme';

describe('mobileTheme', () => {
  it('returns expected light and dark palette keys', () => {
    const light = getPalette('light');
    const dark = getPalette('dark');

    expect(light.bg).toBe('#fbf8fc');
    expect(dark.bg).toBe('#051426');
    expect(light.button).toBe('#004c22');
    expect(dark.button).toBe('#86efac');
    expect(dark.elevatedSurface).toBe('#1c2b3e');
    expect(dark.productUseOutlineAddToCart).toBe(true);
    expect(light.productUseOutlineAddToCart).toBe(false);
  });

  it('resolves known and unknown order statuses', () => {
    expect(getOrderStatusLabel(1)).toBe('Beklemede');
    expect(getOrderStatusLabel(99)).toBe('Bilinmeyen (99)');
  });
});
