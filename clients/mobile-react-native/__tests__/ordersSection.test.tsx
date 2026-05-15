import React from 'react';
import renderer from 'react-test-renderer';
import { OrdersSection } from '../src/features/orders/OrdersSection';
import { getPalette } from '../src/theme/mobileTheme';
import { act } from 'react-test-renderer';

jest.mock('react-native', () => ({
  Text: 'Text',
  View: 'View',
  ScrollView: 'ScrollView',
  TouchableOpacity: 'TouchableOpacity',
  StyleSheet: { create: <T,>(styles: T) => styles, hairlineWidth: 1 },
  Alert: { alert: jest.fn() }
}));

describe('OrdersSection', () => {
  const lightPalette = getPalette('light');

  it('renders empty-state guidance when there are no orders', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <OrdersSection orders={[]} palette={lightPalette} isLoading={false} errorMessage={null} />
      );
    });

    const allText = tree.root.findAllByType('Text' as any).map((node) => node.props.children).flat().join(' ');
    expect(allText).toContain('No orders yet');
  });

  it('renders Stitch-style order cards for list mode', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <OrdersSection
          orders={[
            {
              id: 11,
              userId: 1,
              status: 1,
              totalAmount: 250,
              createdDate: '2026-01-01T00:00:00Z',
              items: [{ productId: 1, productName: 'Demo', unitPrice: 125, quantity: 2, lineTotal: 250 }]
            },
            {
              id: 12,
              userId: 1,
              status: 2,
              totalAmount: 300,
              createdDate: '2026-01-01T00:00:00Z',
              items: []
            }
          ]}
          palette={lightPalette}
          isLoading={false}
          errorMessage={null}
        />
      );
    });

    const textDump = tree.root.findAllByType('Text' as any).map((node) => node.props.children).flat().join(' ');
    expect(textDump).toContain('TV-0011');
    expect(textDump).toContain('TV-0012');
    expect(textDump).toContain('Pending');
    expect(textDump).toContain('Confirmed');
    expect(textDump).toContain('Active Pipeline');
  });

  it('renders dark bento header and new-order placeholder', () => {
    const darkPalette = getPalette('dark');
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <OrdersSection
          themeMode="dark"
          orders={[]}
          palette={darkPalette}
          isLoading={false}
          errorMessage={null}
        />
      );
    });
    const textDump = tree.root.findAllByType('Text' as any).map((n) => n.props.children).flat().join(' ');
    expect(textDump).toContain('Active Orders');
    expect(textDump).toContain('Real-time logistics');
    expect(textDump).toContain('New Order');
  });
});
