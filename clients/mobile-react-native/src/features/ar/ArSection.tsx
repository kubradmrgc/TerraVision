import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ProductDto } from '../../types/product';
import type { MobilePalette } from '../app/types';
import { ArProductCard } from './ArProductCard';
import { ArRoomsSection } from './ArRoomsSection';
import type { ArSessionResponseDto } from '@terravision/shared';
import { StateMessage } from '../../ui/StateMessage';

type Props = {
  products: ProductDto[];
  palette: MobilePalette;
  isLoading: boolean;
  onPreviewAr: (productId: number) => void;
  onOpenDetail: (productId: number) => void;
  sessions: ArSessionResponseDto[];
  isArSessionsLoading: boolean;
  isArSessionsRefreshing: boolean;
  arSessionsErrorMessage: string | null;
  onRefreshArSessions: () => void;
};

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'AR ürün seçin',
    desc: 'Aşağıdaki listeden evinizde denemek istediğiniz bitkiyi seçin.'
  },
  {
    step: '2',
    title: 'Önizlemeyi başlatın',
    desc: 'Android’de Google Scene Viewer, iOS’ta Quick Look ile 3D modeli alanınızda görürsünüz.'
  },
  {
    step: '3',
    title: 'Odanıza kaydedin',
    desc: 'Ekran görüntüsü ve notlarla yerleşimi AR Odalarım bölümünde saklayın.'
  }
] as const;

export function ArSection({
  products,
  palette,
  isLoading,
  onPreviewAr,
  onOpenDetail,
  sessions,
  isArSessionsLoading,
  isArSessionsRefreshing,
  arSessionsErrorMessage,
  onRefreshArSessions
}: Props): React.JSX.Element {
  const arProducts = products.filter((p) => p.isArCompatible);

  return (
    <View style={styles.wrap}>
      <View style={[styles.hero, { backgroundColor: palette.primaryContainer, borderColor: palette.outlineVariant }]}>
        <Text style={[styles.heroEyebrow, { color: palette.onPrimaryContainer }]}>Artırılmış gerçeklik</Text>
        <Text style={[styles.heroTitle, { color: palette.onPrimaryContainer }]}>
          Bitkileri alanınızda görün
        </Text>
        <Text style={[styles.heroLead, { color: palette.onPrimaryContainer }]}>
          AR uyumlu ürünlerde 3D modeli telefonunuzla odanızda veya bahçenizde deneyebilirsiniz.
        </Text>
      </View>

      <View style={[styles.block, { backgroundColor: palette.card, borderColor: palette.outlineVariant }]}>
        <Text style={[styles.blockTitle, { color: palette.text }]}>Nasıl çalışır?</Text>
        {HOW_IT_WORKS.map((item) => (
          <View key={item.step} style={styles.stepRow}>
            <View style={[styles.stepNum, { backgroundColor: palette.arPillBg, borderColor: palette.arPillBorder }]}>
              <Text style={[styles.stepNumText, { color: palette.arPillText }]}>{item.step}</Text>
            </View>
            <View style={styles.stepCopy}>
              <Text style={[styles.stepTitle, { color: palette.text }]}>{item.title}</Text>
              <Text style={[styles.stepDesc, { color: palette.subText }]}>{item.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.catalogHead}>
        <Text style={[styles.blockTitle, { color: palette.text }]}>AR uyumlu ürünler</Text>
        <Text style={[styles.catalogCount, { color: palette.subText }]}>
          {isLoading ? '…' : `${arProducts.length} ürün`}
        </Text>
      </View>

      {isLoading ? (
        <StateMessage
          variant="banner"
          text="AR ürünleri yükleniyor…"
          color={palette.subText}
          backgroundColor={palette.mutedCard}
          borderColor={palette.outlineVariant}
        />
      ) : null}

      {!isLoading && arProducts.length === 0 ? (
        <StateMessage
          variant="banner"
          text="Henüz AR uyumlu ürün yok. Yönetici panelinden ürüne 3D model yükleyin."
          color={palette.subText}
          backgroundColor={palette.mutedCard}
          borderColor={palette.outlineVariant}
        />
      ) : null}

      <View style={styles.grid}>
        {arProducts.map((item) => (
          <View key={item.id} style={styles.gridItem}>
            <ArProductCard
              item={item}
              palette={palette}
              onPreviewAr={onPreviewAr}
              onOpenDetail={onOpenDetail}
            />
          </View>
        ))}
      </View>

      <ArRoomsSection
        sessions={sessions}
        palette={palette}
        isLoading={isArSessionsLoading}
        isRefreshing={isArSessionsRefreshing}
        errorMessage={arSessionsErrorMessage}
        onRefresh={onRefreshArSessions}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  hero: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 18
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 6
  },
  heroTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3, marginBottom: 8 },
  heroLead: { fontSize: 14, lineHeight: 21 },
  block: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14
  },
  blockTitle: { fontSize: 17, fontWeight: '800', marginBottom: 12 },
  stepRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepNumText: { fontSize: 13, fontWeight: '800' },
  stepCopy: { flex: 1 },
  stepTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  stepDesc: { fontSize: 13, lineHeight: 19 },
  catalogHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8
  },
  catalogCount: { fontSize: 13, fontWeight: '600' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6
  },
  gridItem: {
    width: '50%',
    paddingHorizontal: 6
  }
});
