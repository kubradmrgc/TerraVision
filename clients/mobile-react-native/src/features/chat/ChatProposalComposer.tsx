import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { toStatusMessage } from '@terravision/shared';
import { chatService } from '../../services/chatService';
import { productService } from '../../services/productService';
import type { ProductDto } from '../../services/productService';
import type { MobilePalette } from '../app/types';

type Props = {
  sessionId: number;
  palette: MobilePalette;
  onSent: () => void;
};

export function ChatProposalComposer({ sessionId, palette, onSent }: Props): React.JSX.Element {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [title, setTitle] = useState('Peyzaj ürün teklifi');
  const [notes, setNotes] = useState('');
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void productService.getProducts().then(setProducts).catch(() => undefined);
  }, []);

  const toggleProduct = (productId: number) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[productId]) {
        delete next[productId];
      } else {
        next[productId] = 1;
      }
      return next;
    });
  };

  const handleSend = async () => {
    const lines = Object.entries(selected).map(([productId, quantity]) => ({
      productId: Number(productId),
      quantity
    }));

    if (lines.length === 0) {
      setError('En az bir ürün seçin.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await chatService.sendProposal(sessionId, {
        title: title.trim(),
        notes: notes.trim() || null,
        lines
      });
      setSelected({});
      setOpen(false);
      onSent();
    } catch (err) {
      setError(toStatusMessage(err, 'Teklif gönderilemedi.', {}));
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <TouchableOpacity
        style={[styles.toggleBtn, { borderColor: palette.outlineVariant, backgroundColor: palette.mutedCard }]}
        onPress={() => setOpen(true)}
      >
        <Text style={[styles.toggleText, { color: palette.brandTitle }]}>Ürün teklifi gönder</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.panel, { backgroundColor: palette.card, borderColor: palette.outlineVariant }]}>
      <Text style={[styles.panelTitle, { color: palette.text }]}>Ürün teklifi oluştur</Text>
      <TextInput
        style={[styles.input, { color: palette.text, borderColor: palette.outlineVariant }]}
        value={title}
        onChangeText={setTitle}
        placeholder="Başlık"
        placeholderTextColor={palette.subText}
      />
      <TextInput
        style={[styles.input, styles.notes, { color: palette.text, borderColor: palette.outlineVariant }]}
        value={notes}
        onChangeText={setNotes}
        placeholder="Not (opsiyonel)"
        placeholderTextColor={palette.subText}
        multiline
      />
      {products.map((product) => {
        const checked = Boolean(selected[product.id]);
        return (
          <TouchableOpacity
            key={product.id}
            style={[styles.productRow, { borderColor: palette.outlineVariant }, checked && { backgroundColor: palette.mutedCard }]}
            onPress={() => toggleProduct(product.id)}
          >
            <Text style={[styles.productName, { color: palette.text }]}>
              {checked ? '☑' : '☐'} {product.name}
            </Text>
            {checked ? (
              <TextInput
                style={[styles.qtyInput, { color: palette.text, borderColor: palette.outlineVariant }]}
                keyboardType="number-pad"
                value={String(selected[product.id] ?? 1)}
                onChangeText={(v) =>
                  setSelected((prev) => ({
                    ...prev,
                    [product.id]: Math.max(1, Number(v) || 1)
                  }))
                }
              />
            ) : null}
          </TouchableOpacity>
        );
      })}
      {error ? <Text style={[styles.error, { color: palette.stockLowPillText }]}>{error}</Text> : null}
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => setOpen(false)}>
          <Text style={{ color: palette.subText }}>İptal</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: palette.productCtaBg }]}
          disabled={loading}
          onPress={() => void handleSend()}
        >
          {loading ? (
            <ActivityIndicator color={palette.productCtaFg} size="small" />
          ) : (
            <Text style={{ color: palette.productCtaFg, fontWeight: '600' }}>Teklifi gönder</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  toggleBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignSelf: 'flex-start'
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600'
  },
  panel: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '700'
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14
  },
  notes: {
    minHeight: 56,
    textAlignVertical: 'top'
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    gap: 8
  },
  productName: {
    flex: 1,
    fontSize: 14
  },
  qtyInput: {
    width: 48,
    borderWidth: 1,
    borderRadius: 6,
    textAlign: 'center',
    paddingVertical: 4
  },
  error: {
    fontSize: 13
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4
  },
  sendBtn: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8
  }
});
