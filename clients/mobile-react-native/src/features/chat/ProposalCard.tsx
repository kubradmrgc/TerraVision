import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatTryCurrency, type ProposalDto } from '@terravision/shared';
import { cartService } from '../../services/cartService';
import type { MobilePalette } from '../app/types';

type Props = {
  proposal: ProposalDto;
  palette: MobilePalette;
  onAdded?: () => void;
};

export function ProposalCard({ proposal, palette, onAdded }: Props): React.JSX.Element {
  const [adding, setAdding] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    if (adding || done) {
      return;
    }

    setAdding(true);
    setError(null);

    try {
      await cartService.addItems(
        proposal.lines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity
        }))
      );
      setDone(true);
      onAdded?.();
    } catch {
      setError('Sepete eklenemedi.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: palette.elevatedSurface, borderColor: palette.outlineVariant }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: palette.text }]}>{proposal.title}</Text>
        <Text style={[styles.total, { color: palette.brandTitle }]}>{formatTryCurrency(proposal.totalAmount)}</Text>
      </View>
      {proposal.notes ? (
        <Text style={[styles.notes, { color: palette.subText }]}>{proposal.notes}</Text>
      ) : null}
      {proposal.lines.map((line) => (
        <View key={`${line.productId}-${line.quantity}`} style={styles.lineRow}>
          <Text style={[styles.lineName, { color: palette.text }]}>{line.productName}</Text>
          <Text style={[styles.lineMeta, { color: palette.subText }]}>
            {line.quantity} × {formatTryCurrency(line.unitPrice)}
          </Text>
        </View>
      ))}
      {error ? <Text style={[styles.error, { color: palette.stockLowPillText }]}>{error}</Text> : null}
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: done ? palette.mutedCard : palette.productCtaBg,
            borderColor: palette.productCtaBorder
          }
        ]}
        disabled={adding || done}
        onPress={() => void handleAdd()}
      >
        {adding ? (
          <ActivityIndicator color={palette.productCtaFg} />
        ) : (
          <Text style={[styles.buttonText, { color: palette.productCtaFg }]}>
            {done ? 'Sepete eklendi' : 'Sepete Ekle'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700'
  },
  total: {
    fontSize: 15,
    fontWeight: '700'
  },
  notes: {
    fontSize: 13,
    lineHeight: 18
  },
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8
  },
  lineName: {
    flex: 1,
    fontSize: 14
  },
  lineMeta: {
    fontSize: 13
  },
  error: {
    fontSize: 13
  },
  button: {
    marginTop: 4,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center'
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600'
  }
});
