import React, { useMemo } from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet
} from 'react-native';
import type { StoreCampaignDto, StorefrontDto } from '@terravision/shared';
import { Picker } from '@react-native-picker/picker';
import type { ProductSortKey } from '@terravision/shared';
import type { ProductDto } from '../../types/product';
import type { CategoryDto } from '../../services/categoryService';
import type { UploadFileInput } from '../../services/mediaService';
import type { MobilePalette } from '../app/types';
import { StateMessage } from '../../ui/StateMessage';
import { SectionHeader } from '../../ui/SectionHeader';
import { AR_UPLOAD_HELP_TEXT } from '../ar/arUploadValidation';
import { MarketplaceProductCard } from './MarketplaceProductCard';

type Props = {
  products: ProductDto[];
  totalProductCount: number;
  isAdmin: boolean;
  arPendingProducts: ProductDto[];
  selectedUploadProductId: number | null;
  selectedUploadFile: UploadFileInput | null;
  canUploadArModel: boolean;
  isArUploading: boolean;
  arUploadProgress: number;
  arUploadErrorMessage: string | null;
  arUploadSuccessMessage: string | null;
  palette: MobilePalette;
  categories: CategoryDto[];
  productSearch: string;
  productCategoryId: number | null;
  productArOnly: boolean;
  productInStockOnly: boolean;
  productSort: ProductSortKey;
  onChangeSearch: (value: string) => void;
  onChangeCategory: (value: number | null) => void;
  onToggleArOnly: () => void;
  onToggleInStockOnly: () => void;
  onChangeSort: (value: ProductSortKey) => void;
  onClearFilters: () => void;
  onOpenDetail: (productId: number) => void;
  onOpenCampaign: (campaignId: number) => void;
  onAddToCart: (productId: number) => void;
  onPreviewAr: (productId: number) => void;
  onPickArFile: () => void;
  onUploadArModel: () => void;
  onClearSelectedArFile: () => void;
  onSelectUploadProduct: (value: number | null) => void;
  storefront: StorefrontDto | null;
  isStorefrontLoading: boolean;
};

function CampaignCard({
  campaign,
  palette,
  onOpenCampaign
}: {
  campaign: StoreCampaignDto;
  palette: MobilePalette;
  onOpenCampaign: (campaignId: number) => void;
}): React.JSX.Element {
  const hasProducts = campaign.productIds.length > 0;
  const card = (
    <>
      {campaign.badgeText ? (
        <Text style={[styles.campaignBadge, { color: palette.onPrimaryContainer }]}>{campaign.badgeText}</Text>
      ) : null}
      <Text style={[styles.campaignTitle, { color: palette.onPrimaryContainer }]}>{campaign.title}</Text>
      {campaign.subtitle ? (
        <Text style={[styles.campaignSub, { color: palette.onPrimaryContainer }]} numberOfLines={2}>
          {campaign.subtitle}
        </Text>
      ) : null}
      <Text style={[styles.campaignCount, { color: palette.onPrimaryContainer }]}>
        {hasProducts ? `${campaign.productIds.length} ürün · Kampanyayı gör →` : 'Ürün bağlanmadı'}
      </Text>
    </>
  );

  if (!hasProducts) {
    return (
      <View
        style={[styles.campaignCard, { backgroundColor: palette.primaryContainer, borderColor: palette.outlineVariant }]}
      >
        {card}
      </View>
    );
  }

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`${campaign.title} kampanyası, ürün listesi`}
      activeOpacity={0.85}
      onPress={() => onOpenCampaign(campaign.id)}
      style={[styles.campaignCard, { backgroundColor: palette.primaryContainer, borderColor: palette.outlineVariant }]}
    >
      {card}
    </TouchableOpacity>
  );
}

export function ProductsSection(props: Props): React.JSX.Element {
  const { palette } = props;
  const dealProducts = useMemo(
    () => props.storefront?.dealProducts ?? [],
    [props.storefront?.dealProducts]
  );
  const campaigns = props.storefront?.campaigns ?? [];

  return (
    <View style={styles.root}>
      {props.isStorefrontLoading ? (
        <StateMessage text="Kampanyalar yükleniyor…" color={palette.subText} />
      ) : null}

      {campaigns.length > 0 ? (
        <View style={styles.campaignBlock}>
          <Text style={[styles.blockTitle, { color: palette.text }]}>Kampanyalar</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.campaignScroll}>
            {campaigns.map((c) => (
              <CampaignCard
                key={c.id}
                campaign={c}
                palette={palette}
                onOpenCampaign={props.onOpenCampaign}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      {dealProducts.length > 0 ? (
        <View style={styles.dealsBlock}>
          <SectionHeader
            title="İndirimli fırsatlar"
            subtitle="Kampanya ve indirimli ürünler"
            titleColor={palette.text}
            subtitleColor={palette.subText}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dealsScroll}>
            {dealProducts.map((item) => (
              <MarketplaceProductCard
                key={item.id}
                item={item}
                palette={palette}
                compact
                onPress={() => props.onOpenDetail(item.id)}
                onAddToCart={() => props.onAddToCart(item.id)}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}
      {props.isAdmin && (
        <View
          style={[
            styles.adminCard,
            { backgroundColor: palette.mutedCard, borderColor: palette.outlineVariant }
          ]}
        >
          <SectionHeader
            title="AR model yükleme"
            subtitle="Saha dağıtımı için 3B varlıkları yükleyin"
            titleColor={palette.text}
            subtitleColor={palette.subText}
            right={
              <TouchableOpacity
                style={[styles.newAssetBtn, { backgroundColor: palette.primaryContainer }]}
                onPress={props.onPickArFile}
                disabled={props.arPendingProducts.length === 0}
              >
                <Text style={[styles.newAssetBtnText, { color: palette.onPrimaryContainer }]}>Yeni dosya</Text>
              </TouchableOpacity>
            }
          />
          <View style={styles.adminGrid}>
            <View style={[styles.adminCol, styles.adminColFirst]}>
              <Text style={[styles.caption, { color: palette.subText }]}>AR modeli yükle</Text>
              <TouchableOpacity
                style={[styles.dashedUpload, { borderColor: palette.outlineVariant, backgroundColor: palette.card }]}
                onPress={props.onPickArFile}
                disabled={props.arPendingProducts.length === 0}
                accessibilityRole="button"
                accessibilityLabel="AR model dosyası seç"
              >
                <View style={[styles.uploadBadge, { borderColor: palette.outlineVariant }]}>
                  <Text style={[styles.uploadBadgeText, { color: palette.brandTitle }]}>↑</Text>
                </View>
                <Text style={[styles.uploadHint, { color: palette.subText }]}>Dosya seçmek için dokunun (.usdz, .glb)</Text>
              </TouchableOpacity>
              <View style={[styles.pickerShell, { borderColor: palette.outlineVariant }]}>
                <Picker
                  selectedValue={props.selectedUploadProductId}
                  onValueChange={(v) => props.onSelectUploadProduct(Number(v))}
                >
                  {props.arPendingProducts.map((product) => (
                    <Picker.Item
                      key={product.id}
                      label={`${product.name} (#${product.id})`}
                      value={product.id}
                    />
                  ))}
                </Picker>
              </View>
            </View>
            <View style={[styles.adminCol, styles.adminColSecond]}>
              {props.arPendingProducts.length === 0 ? (
                <StateMessage text="AR modeli bekleyen ürün yok." color={palette.subText} />
              ) : null}
              {props.selectedUploadFile ? (
                <Text style={[styles.fileName, { color: palette.text }]} numberOfLines={1}>
                  {props.selectedUploadFile.name}
                </Text>
              ) : null}
              {props.isArUploading ? (
                <>
                  <View style={styles.progressLabels}>
                    <Text style={[styles.bodyCompact, { color: palette.text }]}>Yükleniyor</Text>
                    <Text style={[styles.caption, { color: palette.subText }]}>{props.arUploadProgress}%</Text>
                  </View>
                  <View style={[styles.progressTrack, { backgroundColor: palette.card }]}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${Math.min(100, props.arUploadProgress)}%`, backgroundColor: palette.primaryContainer }
                      ]}
                    />
                  </View>
                  <Text style={[styles.caption, { color: palette.subText }]}>
                    Mobil görüntüleme için model işleniyor…
                  </Text>
                </>
              ) : (
                <Text style={[styles.caption, { color: palette.subText }]}>
                  {props.selectedUploadFile ? 'Aşağıdan onayladığınızda yüklenecek.' : AR_UPLOAD_HELP_TEXT}
                </Text>
              )}
            </View>
          </View>
          {props.selectedUploadFile && (
            <TouchableOpacity style={styles.clearFileBtn} onPress={props.onClearSelectedArFile}>
              <Text style={[styles.clearFileText, { color: palette.brandTitle }]}>Seçili dosyayı kaldır</Text>
            </TouchableOpacity>
          )}
          {props.arUploadErrorMessage ? <StateMessage tone="error" text={props.arUploadErrorMessage} /> : null}
          {props.arUploadSuccessMessage ? <StateMessage text={props.arUploadSuccessMessage} color={palette.subText} /> : null}
          <TouchableOpacity
            style={[
              styles.primaryCta,
              styles.adminUploadBtn,
              { backgroundColor: palette.button },
              (!props.canUploadArModel || props.isArUploading) && styles.disabledOpacity
            ]}
            disabled={!props.canUploadArModel || props.isArUploading}
            onPress={props.onUploadArModel}
          >
            <Text style={[styles.primaryCtaText, { color: palette.buttonText }]}>
              {props.isArUploading
                ? `Yükleniyor %${props.arUploadProgress}`
                : props.arUploadErrorMessage
                  ? 'Yüklemeyi tekrar dene'
                  : 'Yükle ve ürüne bağla'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <SectionHeader
        title="Tüm ürünler"
        subtitle={`${props.products.length} ürün`}
        titleColor={palette.text}
        subtitleColor={palette.subText}
      />

      {props.products.length === 0 ? (
        <StateMessage variant="banner" text="Ürün bulunamadı." color={palette.subText} backgroundColor={palette.mutedCard} borderColor={palette.outlineVariant} />
      ) : (
        <View style={styles.marketGrid}>
          {props.products.map((item) => (
            <View key={item.id} style={styles.marketGridCell}>
              <MarketplaceProductCard
                item={item}
                palette={palette}
                onPress={() => props.onOpenDetail(item.id)}
                onAddToCart={() => props.onAddToCart(item.id)}
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { marginBottom: 8 },
  blockTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10, letterSpacing: -0.2 },
  campaignBlock: { marginBottom: 20 },
  campaignScroll: { paddingRight: 8, gap: 12 },
  campaignCard: {
    width: 280,
    minHeight: 120,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginRight: 12
  },
  campaignBadge: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6, marginBottom: 6 },
  campaignTitle: { fontSize: 17, fontWeight: '700', marginBottom: 4 },
  campaignSub: { fontSize: 13, lineHeight: 18, opacity: 0.9 },
  campaignCount: { fontSize: 12, fontWeight: '600', marginTop: 10 },
  dealsBlock: { marginBottom: 16 },
  dealsScroll: { paddingBottom: 4, paddingRight: 8 },
  marketGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  marketGridCell: { width: '48%' },
  sectionTitle: { fontSize: 18, fontWeight: '600', letterSpacing: -0.2 },
  adminCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2
  },
  newAssetBtn: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginLeft: 8
  },
  newAssetBtnText: { fontSize: 13, fontWeight: '700' },
  adminGrid: { flexDirection: 'column' },
  adminCol: { flex: 1 },
  adminColFirst: { marginBottom: 16 },
  adminColSecond: { marginBottom: 0 },
  caption: { fontSize: 12, fontWeight: '500', marginBottom: 8 },
  dashedUpload: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    minHeight: 128,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  uploadBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  uploadBadgeText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.6 },
  uploadHint: { fontSize: 14, textAlign: 'center', paddingHorizontal: 8 },
  pickerShell: { borderWidth: 1, borderRadius: 10, overflow: 'hidden' },
  fileName: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  bodyCompact: { fontSize: 14 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressTrack: { height: 8, borderRadius: 999, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: 8, borderRadius: 999 },
  clearFileBtn: { alignSelf: 'flex-start', marginTop: 8, marginBottom: 8 },
  clearFileText: { fontSize: 14, fontWeight: '600' },
  adminUploadBtn: { marginTop: 12 },
  disabledOpacity: { opacity: 0.55 },
  primaryCta: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  primaryCtaText: { fontSize: 14, fontWeight: '600' }
});
