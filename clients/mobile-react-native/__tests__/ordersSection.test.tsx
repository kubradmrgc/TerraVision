import React from 'react';
import renderer from 'react-test-renderer';
import { OrdersSection } from '../src/features/orders/OrdersSection';
import { act } from 'react-test-renderer';

jest.mock('react-native', () => ({
  Text: 'Text',
  View: 'View',
  StyleSheet: { create: <T,>(styles: T) => styles }
}));

describe('OrdersSection', () => {
  const palette = { card: '#fff', text: '#111', border: '#ddd' };

  it('renders empty-state guidance when there are no orders', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <OrdersSection orders={[]} palette={palette} isLoading={false} errorMessage={null} />
      );
    });

    const allText = tree.root.findAllByType('Text' as any).map((node) => node.props.children).flat().join(' ');
    expect(allText).toContain('Henuz siparisiniz yok');
  });

  it('renders order cards for list mode', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <OrdersSection
          orders={[
            { id: 11, userId: 1, status: 1, totalAmount: 250, createdDate: '2026-01-01T00:00:00Z', items: [], statusHistory: [] },
            { id: 12, userId: 1, status: 2, totalAmount: 300, createdDate: '2026-01-01T00:00:00Z', items: [], statusHistory: [] }
          ]}
          palette={palette}
          isLoading={false}
          errorMessage={null}
        />
      );
    });

    const textDump = tree.root.findAllByType('Text' as any).map((node) => node.props.children).flat().join(' ');
    expect(textDump).toContain('11');
    expect(textDump).toContain('12');
    expect(textDump).toContain('Toplam');
  });
});
