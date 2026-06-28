import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import type { CampaignDetailDto } from '@terravision/shared';
import { campaignService } from '../../services/campaignService';
import { toStatusMessage } from '../../ui/httpError';
import type { MobilePalette } from '../app/types';
import { MarketplaceProductCard } from './MarketplaceProductCard';

type Props = {
  campaignId: number | null;
  visible: boolean;
  onClose: () => void;
  palette: MobilePalette;
  onOpenDetail: (productId: number) => void;
  onAddToCart: (productId: number) => void;
};

export function CampaignDetailModal({
  campaignId,
  visible,
  onClose,
  palette,
  onOpenDetail,
  onAddToCart
}: Props): React.JSX.Element {
  const [detail, setDetail] = useState<CampaignDetailDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (campaignId == null) return;
    setLoading(true);
    setError(null);
    try {
      const data = await campaignService.getStorefrontCampaign(campaignId);
      setDetail(data);
    } catch (err) {
      setDetail(null);
      setError(toStatusMessage(err, 'Kampanya yüklenemedi.', {}));
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    if (visible && campaignId != null) {
      void load();
    } else if (!visible) {
      setDetail(null);
      setError(null);
    }
  }, [visible, campaignId, load]);

  const campaign = detail?.campaign;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: palette.card }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: palette.text }]}>
              {campaign?.title ?? 'Kampanya'}
            </Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Kapat">
              <Text style={[styles.close, { color: palette.brandTitle }]}>Kapat</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator style={styles.loader} color={palette.brandTitle} />
          ) : null}
          {error ? (
            <Text style={[styles.error, { color: palette.stockLowPillText }]} role="alert">
              {error}
            </Text>
          ) : null}

          {campaign?.subtitle ? (
            <Text style={[styles.subtitle, { color: palette.subText }]}>{campaign.subtitle}</Text>
          ) : null}

          <ScrollView contentContainerStyle={styles.scroll}>
            {detail?.products.length ? (
              detail.products.map((item) => (
                <MarketplaceProductCard
                  key={item.id}
                  item={item}
                  palette={palette}
                  onPress={() => {
                    onClose();
                    onOpenDetail(item.id);
                  }}
                  onAddToCart={() => onAddToCart(item.id)}
                />
              ))
            ) : !loading && !error ? (
              <Text style={[styles.empty, { color: palette.subText }]}>Bu kampanyada ürün yok.</Text>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '88%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '700', flex: 1, marginRight: 12 },
  close: { fontSize: 16, fontWeight: '600' },
  subtitle: { fontSize: 14, marginBottom: 12 },
  scroll: { paddingBottom: 16, gap: 12 },
  loader: { marginVertical: 24 },
  error: { marginBottom: 12 },
  empty: { textAlign: 'center', marginVertical: 24 }
});
