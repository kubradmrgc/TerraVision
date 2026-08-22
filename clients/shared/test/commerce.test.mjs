import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeLineTotal } from '../src/commerce/pricing.ts';
import {
  computeCartSubtotal,
  computeCartDisplayTotals,
  sumCartItemQuantity
} from '../src/commerce/cartTotals.ts';
import { formatTryCurrency } from '../src/format/currency.ts';

describe('commerce', () => {
  it('computeLineTotal matches server formula', () => {
    assert.equal(computeLineTotal(60, 2), 120);
  });

  it('computeCartSubtotal sums line totals', () => {
    const subtotal = computeCartSubtotal([
      { lineTotal: 120, quantity: 2 },
      { lineTotal: 99, quantity: 1 }
    ]);
    assert.equal(subtotal, 219);
  });

  it('sumCartItemQuantity counts units', () => {
    assert.equal(
      sumCartItemQuantity([
        { quantity: 2 },
        { quantity: 1 }
      ]),
      3
    );
  });

  it('computeCartDisplayTotals prefers API totalAmount', () => {
    const totals = computeCartDisplayTotals({
      totalAmount: 250,
      items: [{ productId: 1, productName: 'A', imageUrl: '', unitPrice: 125, quantity: 2, lineTotal: 250 }]
    });
    assert.equal(totals.subtotal, 250);
    assert.equal(totals.total, 250);
    assert.equal(totals.itemCount, 2);
    assert.equal(totals.logisticsFee, 0);
  });

  it('computeCartDisplayTotals falls back to subtotal + logistics', () => {
    const totals = computeCartDisplayTotals(
      {
        items: [{ productId: 1, productName: 'A', imageUrl: '', unitPrice: 50, quantity: 1, lineTotal: 50 }]
      },
      { logisticsFee: 15 }
    );
    assert.equal(totals.subtotal, 50);
    assert.equal(totals.logisticsFee, 15);
    assert.equal(totals.total, 65);
  });
});

describe('formatTryCurrency', () => {
  it('formats numeric values', () => {
    const formatted = formatTryCurrency(120);
    assert.match(formatted, /120/);
  });
});
