import React from 'react';
import renderer from 'react-test-renderer';
import { CartSection } from '../src/features/cart/CartSection';
import { getPalette } from '../src/theme/mobileTheme';
import { act } from 'react-test-renderer';

jest.mock('react-native', () => ({
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
  StyleSheet: { create: <T,>(styles: T) => styles, hairlineWidth: 1 }
}));

const lightPalette = {
  bg: '#fbf8fc',
  card: '#ffffff',
  text: '#1b1b1e',
  subText: '#404940',
  border: '#707a6f',
  button: '#004c22',
  buttonText: '#ffffff',
  header: '#fbf8fc',
  mutedCard: '#f6f2f7',
  brandTitle: '#004c22',
  outlineVariant: '#bfc9bd',
  surfaceDim: '#dcd9dd',
  secondaryContainer: '#8cf5b2',
  onSecondaryContainer: '#007241',
  primaryContainer: '#166534',
  onPrimaryContainer: '#93e0a2',
  bottomNav: '#f0edf1',
  navInactive: '#404940',
  imagePlaceholder: '#e4e1e6',
  elevatedSurface: '#ffffff',
  surfaceLowest: '#ffffff',
  stockPillBg: '#166534',
  stockPillBorder: '#166534',
  stockPillText: '#93e0a2',
  stockLowPillBg: '#fef2f2',
  stockLowPillBorder: '#fecaca',
  stockLowPillText: '#b91c1c',
  arPillBg: '#8cf5b2',
  arPillBorder: '#8cf5b2',
  arPillText: '#007241',
  productCtaBg: '#004c22',
  productCtaFg: '#ffffff',
  productCtaBorder: '#004c22',
  productUseOutlineAddToCart: false,
  realtimeCapsuleBg: '#8cf5b2',
  realtimeCapsuleBorder: '#8cf5b2',
  realtimeCapsuleLabelColor: '#007241',
  realtimeCapsuleDotColor: '#007241'
};

function findByLabel(root: renderer.ReactTestRenderer['root'], label: string) {
  return root.findAll((n) => n.props && n.props.accessibilityLabel === label);
}

describe('CartSection', () => {
  it('disables primary actions when cart is empty', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <CartSection
          cart={{ cartId: 1, userId: 1, totalAmount: 0, items: [] }}
          palette={lightPalette}
          isLoading={false}
          isMutating={false}
          errorMessage={null}
          onPlaceOrder={jest.fn()}
          onClearCart={jest.fn()}
          onDecrease={jest.fn()}
          onIncrease={jest.fn()}
          onRemove={jest.fn()}
        />
      );
    });

    const place = findByLabel(tree.root, 'Siparişi tamamla');
    const clear = findByLabel(tree.root, 'Sepeti temizle');
    expect(place.length).toBe(1);
    expect(place[0].props.disabled).toBe(true);
    expect(clear.length).toBe(0);
  });

  it('enables item actions when cart has products and not mutating', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <CartSection
          cart={{
            cartId: 1,
            userId: 1,
            totalAmount: 120,
            items: [
              {
                productId: 7,
                productName: 'Demo',
                imageUrl: '',
                unitPrice: 60,
                quantity: 2,
                lineTotal: 120
              }
            ]
          }}
          palette={lightPalette}
          isLoading={false}
          isMutating={false}
          errorMessage={null}
          onPlaceOrder={jest.fn()}
          onClearCart={jest.fn()}
          onDecrease={jest.fn()}
          onIncrease={jest.fn()}
          onRemove={jest.fn()}
        />
      );
    });

    const touchables = tree.root.findAll((node) => node.props && typeof node.props.onPress === 'function');
    expect(touchables.some((node) => node.props.disabled === false)).toBe(true);
  });

  it('renders Stitch dark order summary when themeMode is dark', () => {
    const darkPalette = getPalette('dark');
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <CartSection
          themeMode="dark"
          cart={{
            cartId: 1,
            userId: 1,
            totalAmount: 99,
            items: [
              { productId: 1, productName: 'X', imageUrl: '', unitPrice: 99, quantity: 1, lineTotal: 99 }
            ]
          }}
          palette={darkPalette}
          isLoading={false}
          isMutating={false}
          errorMessage={null}
          onPlaceOrder={jest.fn()}
          onClearCart={jest.fn()}
          onDecrease={jest.fn()}
          onIncrease={jest.fn()}
          onRemove={jest.fn()}
        />
      );
    });

    const texts = tree.root.findAll(
      (n) => (n as { type?: string }).type === 'Text' && n.props && n.props.children === 'Sipariş özeti'
    );
    expect(texts.length).toBeGreaterThan(0);
    const pillLabels = tree.root.findAll(
      (n) => (n as { type?: string }).type === 'Text' && n.props && n.props.children === 'Siparişi tamamla'
    );
    expect(pillLabels.length).toBeGreaterThan(0);
  });
});
