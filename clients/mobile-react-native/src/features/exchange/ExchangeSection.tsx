import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import {
  EXCHANGE_CONDITION,
  EXCHANGE_CONDITION_LABELS,
  EXCHANGE_CONDITION_TAG_OPTIONS,
  type ExchangeCondition,
  EXCHANGE_OFFER_STATUS,
  EXCHANGE_OFFER_STATUS_LABELS,
  EXCHANGE_OFFER_TYPE,
  EXCHANGE_OFFER_TYPE_LABELS,
  ExchangeOfferDto,
  ExchangeOfferType,
  ExchangeProductDto,
  formatTryCurrency
} from '@terravision/shared';
import { isAxiosError } from 'axios';
import type { MobilePalette } from '../app/types';
import { exchangeService } from '../../services/exchangeService';
import { MultipartUploadError } from '../../services/uploadFileHelpers';
import { pickGalleryPhotoForUpload } from '../../services/pickGalleryPhoto';
import { resolveMediaPublicUrl } from '../../services/mediaPublicUrl';
import { realtimeService } from '../../services/realtimeService';
import { EXCHANGE_UI_MESSAGES, exchangeErrorForStatus } from './exchangeErrors';
import { StateMessage } from '../../ui/StateMessage';
import { SectionHeader } from '../../ui/SectionHeader';
import { mobileTypography } from '../../theme/mobileTypography';

type Props = {
  palette: MobilePalette;
};

type ViewMode = 'market' | 'mine' | 'offers';

const TABS: { key: ViewMode; label: string }[] = [
  { key: 'market', label: 'Pazar' },
  { key: 'mine', label: 'İlanlarım' },
  { key: 'offers', label: 'Teklifler' }
];

const SHARP_IMAGE_PROPS = Platform.OS === 'android' ? { resizeMethod: 'resize' as const } : {};

function ListingPhoto({
  uri,
  frameStyle,
  placeholderBg
}: {
  uri: string;
  frameStyle: object;
  placeholderBg: string;
}): React.JSX.Element {
  return (
    <View style={[frameStyle, { backgroundColor: placeholderBg }]}>
      <Image
        source={{ uri }}
        style={styles.photoImage}
        resizeMode="contain"
        {...SHARP_IMAGE_PROPS}
      />
    </View>
  );
}

export function ExchangeSection({ palette }: Props): React.JSX.Element {
  const [view, setView] = useState<ViewMode>('market');
  const [products, setProducts] = useState<ExchangeProductDto[]>([]);
  const [myProducts, setMyProducts] = useState<ExchangeProductDto[]>([]);
  const [received, setReceived] = useState<ExchangeOfferDto[]>([]);
  const [sent, setSent] = useState<ExchangeOfferDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ExchangeProductDto | null>(null);
  const [offerModalVisible, setOfferModalVisible] = useState(false);
  const [offerType, setOfferType] = useState<ExchangeOfferType>(EXCHANGE_OFFER_TYPE.Swap);
  const [offerMessage, setOfferMessage] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPrice, setNewPrice] = useState('0');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newCondition, setNewCondition] = useState<ExchangeCondition>(EXCHANGE_CONDITION.Healthy);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const pendingCount = useMemo(
    () => received.filter((o) => o.status === EXCHANGE_OFFER_STATUS.Pending).length,
    [received]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [market, mine, recv, snt] = await Promise.all([
        exchangeService.listProducts(),
        exchangeService.getMyProducts(),
        exchangeService.getReceivedOffers(),
        exchangeService.getSentOffers()
      ]);
      setProducts(market);
      setMyProducts(mine);
      setReceived(recv);
      setSent(snt);
    } catch (err) {
      const status = isAxiosError(err) ? err.response?.status : undefined;
      setError(exchangeErrorForStatus(status, EXCHANGE_UI_MESSAGES.loadFailed, err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void realtimeService.connect();
    const unsubListed = realtimeService.onExchangeProductListed((event) => {
      setProducts((prev) => (prev.some((p) => p.id === event.product.id) ? prev : [event.product, ...prev]));
    });
    const unsubReceived = realtimeService.onExchangeOfferReceived(() => void load());
    const unsubStatus = realtimeService.onExchangeOfferStatusChanged(() => void load());
    const unsubReconnect = realtimeService.onReconnected(() => void load());
    return () => {
      unsubListed();
      unsubReceived();
      unsubStatus();
      unsubReconnect();
    };
  }, [load]);

  const pickListingPhoto = async () => {
    try {
      const picked = await pickGalleryPhotoForUpload();
      if ('cancelled' in picked) return;
      if ('error' in picked) {
        setError(picked.error);
        return;
      }

      setIsUploadingPhoto(true);
      setError(null);
      setSuccess(null);
      const url = await exchangeService.uploadExchangeImage(picked.file);
      setNewPhotoUrl(url);
      setSuccess('Fotoğraf yüklendi.');
    } catch (err) {
      const status =
        err instanceof MultipartUploadError
          ? err.status
          : isAxiosError(err)
            ? err.response?.status
            : undefined;
      setError(exchangeErrorForStatus(status, EXCHANGE_UI_MESSAGES.uploadFailed, err));
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const createListing = async () => {
    setIsMutating(true);
    setError(null);
    setSuccess(null);
    try {
      await exchangeService.createProduct({
        title: newTitle.trim(),
        description: newDescription.trim(),
        price: Number(newPrice) || 0,
        condition: newCondition,
        photoUrls: newPhotoUrl ? [newPhotoUrl] : []
      });
      setNewTitle('');
      setNewDescription('');
      setNewPrice('0');
      setNewPhotoUrl('');
      setNewCondition(EXCHANGE_CONDITION.Healthy);
      setSuccess('İlan yayınlandı.');
      await load();
      setView('mine');
    } catch (err) {
      const status = isAxiosError(err) ? err.response?.status : undefined;
      setError(exchangeErrorForStatus(status, EXCHANGE_UI_MESSAGES.listingFailed, err));
    } finally {
      setIsMutating(false);
    }
  };

  const submitOffer = async () => {
    if (!selectedProduct) return;
    setIsMutating(true);
    setError(null);
    try {
      await exchangeService.createOffer({
        productId: selectedProduct.id,
        offerType,
        message: offerMessage
      });
      setOfferModalVisible(false);
      setOfferMessage('');
      setSuccess('Teklif gönderildi.');
      await load();
    } catch (err) {
      const status = isAxiosError(err) ? err.response?.status : undefined;
      setError(exchangeErrorForStatus(status, EXCHANGE_UI_MESSAGES.offerFailed, err));
    } finally {
      setIsMutating(false);
    }
  };

  const respondOffer = async (offerId: number, accept: boolean) => {
    setIsMutating(true);
    setError(null);
    try {
      if (accept) await exchangeService.acceptOffer(offerId);
      else await exchangeService.rejectOffer(offerId);
      setSuccess(accept ? 'Teklif kabul edildi.' : 'Teklif reddedildi.');
      await load();
    } catch (err) {
      const status = isAxiosError(err) ? err.response?.status : undefined;
      setError(exchangeErrorForStatus(status, EXCHANGE_UI_MESSAGES.statusFailed, err));
    } finally {
      setIsMutating(false);
    }
  };

  const renderProductCard = (item: ExchangeProductDto) => (
    <View
      key={item.id}
      style={[styles.productCard, { backgroundColor: palette.card, borderColor: palette.outlineVariant }]}
    >
      {item.photoUrls[0] ? (
        <ListingPhoto
          uri={resolveMediaPublicUrl(item.photoUrls[0])}
          frameStyle={styles.thumbFrame}
          placeholderBg={palette.imagePlaceholder}
        />
      ) : (
        <View style={[styles.thumbPlaceholder, { backgroundColor: palette.imagePlaceholder }]}>
          <Text style={styles.placeholderEmoji}>🪴</Text>
        </View>
      )}
      <View style={styles.badgeRow}>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: item.isSwapOnly ? palette.arPillBg : palette.stockPillBg,
              borderColor: item.isSwapOnly ? palette.arPillBorder : palette.stockPillBorder
            }
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              { color: item.isSwapOnly ? palette.arPillText : palette.stockPillText }
            ]}
          >
            {item.isSwapOnly ? 'TAKAS' : 'SATILIK'}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: palette.mutedCard, borderColor: palette.outlineVariant }]}>
          <Text style={[styles.badgeText, { color: palette.subText }]}>
            {EXCHANGE_CONDITION_LABELS[item.condition].toUpperCase()}
          </Text>
        </View>
      </View>
      <Text style={[styles.cardTitle, { color: palette.text }]}>{item.title}</Text>
      <Text style={[styles.cardMeta, { color: palette.subText }]}>{item.ownerDisplayName}</Text>
      <Text style={[styles.cardPrice, { color: palette.brandTitle }]}>
        {item.isSwapOnly ? 'Takaslık' : formatTryCurrency(item.price)}
      </Text>
      <TouchableOpacity
        style={[styles.cta, { backgroundColor: palette.button, opacity: isMutating ? 0.6 : 1 }]}
        disabled={isMutating}
        onPress={() => {
          setSelectedProduct(item);
          setOfferType(item.isSwapOnly ? EXCHANGE_OFFER_TYPE.Swap : EXCHANGE_OFFER_TYPE.Buy);
          setOfferModalVisible(true);
        }}
      >
        <Text style={[styles.ctaText, { color: palette.buttonText }]}>Teklif Ver</Text>
      </TouchableOpacity>
    </View>
  );

  const renderOffer = (offer: ExchangeOfferDto, incoming: boolean) => (
    <View
      key={`${incoming ? 'in' : 'out'}-${offer.id}`}
      style={[styles.offerCard, { backgroundColor: palette.card, borderColor: palette.outlineVariant }]}
    >
      <View style={styles.offerHeader}>
        <Text style={[styles.cardTitle, { color: palette.text, flex: 1 }]}>{offer.productTitle}</Text>
        <View
          style={[
            styles.statusPill,
            offer.status === EXCHANGE_OFFER_STATUS.Pending && { backgroundColor: palette.stockLowPillBg },
            offer.status === EXCHANGE_OFFER_STATUS.Accepted && { backgroundColor: palette.stockPillBg },
            offer.status === EXCHANGE_OFFER_STATUS.Rejected && { backgroundColor: palette.mutedCard }
          ]}
        >
          <Text style={[styles.statusText, { color: palette.text }]}>
            {EXCHANGE_OFFER_STATUS_LABELS[offer.status]}
          </Text>
        </View>
      </View>
      <Text style={[styles.cardMeta, { color: palette.subText }]}>
        {incoming ? offer.senderDisplayName : 'Siz'} · {EXCHANGE_OFFER_TYPE_LABELS[offer.offerType]}
      </Text>
      {offer.message ? (
        <Text style={[styles.offerMessage, { color: palette.text, backgroundColor: palette.mutedCard }]}>
          {offer.message}
        </Text>
      ) : null}
      {incoming && offer.status === EXCHANGE_OFFER_STATUS.Pending ? (
        <View style={styles.offerActions}>
          <TouchableOpacity
            style={[styles.cta, { flex: 1, backgroundColor: palette.button }]}
            disabled={isMutating}
            onPress={() => void respondOffer(offer.id, true)}
          >
            <Text style={[styles.ctaText, { color: palette.buttonText }]}>Kabul</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.ctaOutline, { flex: 1, borderColor: palette.outlineVariant }]}
            disabled={isMutating}
            onPress={() => void respondOffer(offer.id, false)}
          >
            <Text style={{ color: palette.text, fontWeight: '600' }}>Red</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );

  const listHeader = (
    <View>
      <SectionHeader
        title="TerraTakas"
        subtitle="Bitki ve saksı takası · Canlı ilanlar"
        titleColor={palette.text}
        subtitleColor={palette.subText}
      />
      <View style={[styles.tabBar, { backgroundColor: palette.mutedCard, borderColor: palette.outlineVariant }]}>
        {TABS.map((tab) => {
          const active = view === tab.key;
          const badge =
            tab.key === 'offers' && pendingCount > 0 ? pendingCount : tab.key === 'mine' ? myProducts.length : 0;
          return (
            <Pressable
              key={tab.key}
              style={[
                styles.tab,
                active && { backgroundColor: palette.secondaryContainer, borderColor: palette.brandTitle }
              ]}
              onPress={() => setView(tab.key)}
            >
              <Text
                style={[
                  mobileTypography.navLabel,
                  { color: active ? palette.onSecondaryContainer : palette.subText, fontWeight: active ? '700' : '500' }
                ]}
              >
                {tab.label}
                {badge > 0 ? ` (${badge})` : ''}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <StateMessage tone="error" text={error} color={palette.text} /> : null}
      {success ? <StateMessage text={success} color={palette.brandTitle} /> : null}
      {view === 'mine' ? (
        <View style={[styles.formCard, { backgroundColor: palette.elevatedSurface, borderColor: palette.outlineVariant }]}>
          <Text style={[styles.formTitle, { color: palette.text }]}>Yeni ilan</Text>
          <TextInput
            style={[styles.input, { color: palette.text, borderColor: palette.outlineVariant, backgroundColor: palette.card }]}
            placeholder="Başlık"
            placeholderTextColor={palette.subText}
            value={newTitle}
            editable={!isMutating}
            onChangeText={setNewTitle}
          />
          <TextInput
            style={[styles.input, styles.inputMultiline, { color: palette.text, borderColor: palette.outlineVariant, backgroundColor: palette.card }]}
            placeholder="Açıklama"
            placeholderTextColor={palette.subText}
            multiline
            value={newDescription}
            editable={!isMutating}
            onChangeText={setNewDescription}
          />
          <Text style={[styles.tagLegend, { color: palette.subText }]}>Durum etiketi</Text>
          <View style={styles.tagRow}>
            {EXCHANGE_CONDITION_TAG_OPTIONS.map((opt) => {
              const active = newCondition === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  style={[
                    styles.tagChip,
                    {
                      borderColor: active ? palette.button : palette.outlineVariant,
                      backgroundColor: active ? palette.button : palette.card
                    }
                  ]}
                  disabled={isMutating}
                  onPress={() => setNewCondition(opt.value)}
                >
                  <Text style={{ color: active ? palette.buttonText : palette.text, fontWeight: '700' }}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <TextInput
            style={[styles.input, { color: palette.text, borderColor: palette.outlineVariant, backgroundColor: palette.card }]}
            placeholder="Fiyat (0 = takas)"
            placeholderTextColor={palette.subText}
            keyboardType="decimal-pad"
            value={newPrice}
            editable={!isMutating}
            onChangeText={setNewPrice}
          />
          <TouchableOpacity
            style={[styles.uploadBtn, { borderColor: palette.outlineVariant, backgroundColor: palette.surfaceDim }]}
            disabled={isMutating || isUploadingPhoto}
            onPress={() => void pickListingPhoto()}
          >
            {isUploadingPhoto ? (
              <Text style={{ color: palette.subText }}>Fotoğraf yükleniyor…</Text>
            ) : newPhotoUrl ? (
              <ListingPhoto
                uri={newPhotoUrl}
                frameStyle={styles.uploadPreviewFrame}
                placeholderBg={palette.card}
              />
            ) : (
              <Text style={{ color: palette.subText }}>📷 Fotoğraf seç (izin gerekmez)</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cta, { backgroundColor: palette.button, opacity: isMutating ? 0.6 : 1 }]}
            disabled={isMutating}
            onPress={() => void createListing()}
          >
            <Text style={[styles.ctaText, { color: palette.buttonText }]}>
              {isMutating ? 'Kaydediliyor…' : 'İlanı yayınla'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
      {view === 'offers' ? (
        <Text style={[styles.sectionLabel, { color: palette.subText }]}>Gelen teklifler</Text>
      ) : null}
    </View>
  );

  const marketData = view === 'market' ? products : view === 'mine' ? myProducts : [];

  const offersBody =
    view === 'offers' ? (
      <View>
        {received.length === 0 ? (
          <Text style={[styles.emptyText, { color: palette.subText }]}>Henüz gelen teklif yok.</Text>
        ) : (
          received.map((o) => renderOffer(o, true))
        )}
        <Text style={[styles.sectionLabel, { color: palette.subText, marginTop: 16 }]}>Gönderdiğim</Text>
        {sent.length === 0 ? (
          <Text style={[styles.emptyText, { color: palette.subText }]}>Henüz teklif göndermediniz.</Text>
        ) : (
          sent.map((o) => renderOffer(o, false))
        )}
      </View>
    ) : null;

  if (loading) {
    return (
      <View>
        <SectionHeader title="TerraTakas" subtitle="Yükleniyor…" titleColor={palette.text} subtitleColor={palette.subText} />
        <Text style={{ color: palette.subText, paddingVertical: 24, textAlign: 'center' }}>Yükleniyor…</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, styles.listContent]}>
      {listHeader}
      {view === 'offers' ? (
        offersBody
      ) : marketData.length === 0 ? (
        <Text style={[styles.emptyText, { color: palette.subText }]}>
          {view === 'market' ? 'Henüz ilan yok.' : 'Henüz ilanınız yok.'}
        </Text>
      ) : (
        marketData.map((item) => renderProductCard(item))
      )}

      <Modal visible={offerModalVisible} transparent animationType="slide">
        <Pressable style={styles.modalBackdrop} onPress={() => !isMutating && setOfferModalVisible(false)}>
          <Pressable
            style={[styles.modalSheet, { backgroundColor: palette.card }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.modalHandle, { backgroundColor: palette.outlineVariant }]} />
            <Text style={[styles.formTitle, { color: palette.text }]}>Teklif ver</Text>
            {selectedProduct ? (
              <Text style={[styles.cardMeta, { color: palette.subText, marginBottom: 12 }]}>
                {selectedProduct.title}
              </Text>
            ) : null}
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  {
                    backgroundColor: offerType === EXCHANGE_OFFER_TYPE.Swap ? palette.button : palette.mutedCard,
                    borderColor: palette.outlineVariant
                  }
                ]}
                disabled={isMutating}
                onPress={() => setOfferType(EXCHANGE_OFFER_TYPE.Swap)}
              >
                <Text style={{ color: offerType === EXCHANGE_OFFER_TYPE.Swap ? palette.buttonText : palette.text }}>
                  Takas
                </Text>
              </TouchableOpacity>
              {selectedProduct && !selectedProduct.isSwapOnly ? (
                <TouchableOpacity
                  style={[
                    styles.typeBtn,
                    {
                      backgroundColor: offerType === EXCHANGE_OFFER_TYPE.Buy ? palette.button : palette.mutedCard,
                      borderColor: palette.outlineVariant
                    }
                  ]}
                  disabled={isMutating}
                  onPress={() => setOfferType(EXCHANGE_OFFER_TYPE.Buy)}
                >
                  <Text style={{ color: offerType === EXCHANGE_OFFER_TYPE.Buy ? palette.buttonText : palette.text }}>
                    Para
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <TextInput
              style={[styles.input, styles.inputMultiline, { color: palette.text, borderColor: palette.outlineVariant, backgroundColor: palette.mutedCard }]}
              placeholder="Mesajınız (link yok)"
              placeholderTextColor={palette.subText}
              multiline
              value={offerMessage}
              editable={!isMutating}
              onChangeText={setOfferMessage}
            />
            <TouchableOpacity
              style={[styles.cta, { backgroundColor: palette.button, opacity: isMutating ? 0.6 : 1 }]}
              disabled={isMutating}
              onPress={() => void submitOffer()}
            >
              <Text style={[styles.ctaText, { color: palette.buttonText }]}>
                {isMutating ? 'Gönderiliyor…' : 'Gönder'}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {},
  listContent: { paddingBottom: 24 },
  tabBar: {
    flexDirection: 'row',
    gap: 6,
    padding: 6,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 14
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
    alignItems: 'center'
  },
  productCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 14,
    overflow: 'hidden'
  },
  thumbFrame: {
    width: '100%',
    height: 200,
    alignItems: 'center',
    justifyContent: 'center'
  },
  photoImage: {
    width: '100%',
    height: '100%'
  },
  thumbPlaceholder: { width: '100%', height: 200, alignItems: 'center', justifyContent: 'center' },
  placeholderEmoji: { fontSize: 40, opacity: 0.5 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 12, paddingTop: 10 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },
  cardTitle: { fontSize: 17, fontWeight: '700', paddingHorizontal: 12, marginTop: 8 },
  cardMeta: { fontSize: 13, paddingHorizontal: 12, marginTop: 2 },
  cardPrice: { fontSize: 16, fontWeight: '800', paddingHorizontal: 12, marginTop: 6 },
  cta: { margin: 12, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  ctaText: { fontSize: 15, fontWeight: '700' },
  ctaOutline: {
    marginVertical: 0,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth
  },
  formCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    marginBottom: 16
  },
  formTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  tagLegend: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  tagChip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    fontSize: 15
  },
  inputMultiline: { minHeight: 72, textAlignVertical: 'top' },
  uploadBtn: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    borderStyle: 'dashed',
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    overflow: 'hidden',
    minHeight: 200
  },
  uploadPreviewFrame: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  offerCard: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    marginBottom: 10
  },
  offerHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  statusText: { fontSize: 11, fontWeight: '700' },
  offerMessage: {
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
    fontSize: 14,
    lineHeight: 20
  },
  offerActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8
  },
  emptyText: { textAlign: 'center', paddingVertical: 20, fontSize: 14 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 28
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16
  },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth
  }
});
