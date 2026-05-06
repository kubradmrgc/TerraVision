import React from 'react';
import renderer from 'react-test-renderer';
import { CartSection } from '../src/features/cart/CartSection';
import { act } from 'react-test-renderer';

jest.mock('react-native', () => ({
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
  StyleSheet: { create: <T,>(styles: T) => styles }
}));

describe('CartSection', () => {
  const palette = { card: '#fff', text: '#111', border: '#ddd' };

  it('disables primary actions when cart is empty', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <CartSection
          cart={{ cartId: 1, userId: 1, totalAmount: 0, items: [] }}
          palette={palette}
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
    // First two touchables are Place Order and Clear Cart.
    expect(touchables[0].props.disabled).toBe(true);
    expect(touchables[1].props.disabled).toBe(true);
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
            items: [{ productId: 7, productName: 'Demo', unitPrice: 60, quantity: 2, lineTotal: 120 }]
          }}
          palette={palette}
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
});
