import React, { useCallback, useEffect, useState } from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { errorCodes, isErrorWithCode, pick, types } from '@react-native-documents/picker';
import {
  EXCHANGE_CONDITION,
  EXCHANGE_CONDITION_LABELS,
  EXCHANGE_OFFER_STATUS,
  EXCHANGE_OFFER_STATUS_LABELS,
  EXCHANGE_OFFER_TYPE,
  EXCHANGE_OFFER_TYPE_LABELS,
  ExchangeOfferDto,
  ExchangeOfferType,
  ExchangeProductDto,
  formatTryCurrency
} from '@terravision/shared';
import type { MobilePalette } from '../app/types';
import { exchangeService } from '../../services/exchangeService';
import { realtimeService } from '../../services/realtimeService';
import { EXCHANGE_UI_MESSAGES, exchangeErrorForStatus } from './exchangeErrors';
import { StateMessage } from '../../ui/StateMessage';
import { isAxiosError } from 'axios';

type Props = {
  palette: MobilePalette;
};

type ViewMode = 'market' | 'mine' | 'offers';

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
      setError(exchangeErrorForStatus(status, EXCHANGE_UI_MESSAGES.loadFailed));
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
    const unsubReceived = realtimeService.onExchangeOfferReceived(() => {
      void load();
    });
    const unsubStatus = realtimeService.onExchangeOfferStatusChanged(() => {
      void load();
    });
    const unsubReconnect = realtimeService.onReconnected(() => {
      void load();
    });
    return () => {
      unsubListed();
      unsubReceived();
      unsubStatus();
      unsubReconnect();
    };
  }, [load]);

  const pickListingPhoto = async () => {
    try {
      const [file] = await pick({ type: [types.images], allowMultiSelection: false });
      if (!file?.uri) return;
      setIsMutating(true);
      const url = await exchangeService.uploadExchangeImage({
        uri: file.uri,
        name: file.name ?? `exchange-${Date.now()}.jpg`,
        type: file.type ?? 'image/jpeg'
      });
      setNewPhotoUrl(url);
      setSuccess('Fotoğraf yüklendi.');
    } catch (err) {
      if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) {
        return;
      }
      const status = isAxiosError(err) ? err.response?.status : undefined;
      setError(exchangeErrorForStatus(status, EXCHANGE_UI_MESSAGES.uploadFailed));
    } finally {
      setIsMutating(false);
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
        condition: EXCHANGE_CONDITION.Healthy,
        photoUrls: newPhotoUrl ? [newPhotoUrl] : []
      });
      setNewTitle('');
      setNewDescription('');
      setNewPrice('0');
      setNewPhotoUrl('');
      setSuccess('İlan yayınlandı.');
      await load();
      setView('mine');
    } catch (err) {
      const status = isAxiosError(err) ? err.response?.status : undefined;
      setError(exchangeErrorForStatus(status, EXCHANGE_UI_MESSAGES.listingFailed));
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
      setError(exchangeErrorForStatus(status, EXCHANGE_UI_MESSAGES.offerFailed));
    } finally {
      setIsMutating(false);
    }
  };

  const respondOffer = async (offerId: number, accept: boolean) => {
    setIsMutating(true);
    setError(null);
    try {
      if (accept) {
        await exchangeService.acceptOffer(offerId);
      } else {
        await exchangeService.rejectOffer(offerId);
      }
      setSuccess(accept ? 'Teklif kabul edildi.' : 'Teklif reddedildi.');
      await load();
    } catch (err) {
      const status = isAxiosError(err) ? err.response?.status : undefined;
      setError(exchangeErrorForStatus(status, EXCHANGE_UI_MESSAGES.statusFailed));
    } finally {
      setIsMutating(false);
    }
  };

  const renderProductCard = (product: ExchangeProductDto, showOffer?: boolean) => (
    <View
      key={product.id}
      style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}
    >
      {product.photoUrls[0] ? (
        <Image source={{ uri: product.photoUrls[0] }} style={styles.thumb} resizeMode="cover" />
      ) : null}
      <Text style={[styles.title, { color: palette.text }]}>{product.title}</Text>
      <Text style={{ color: palette.subText }}>
        {product.ownerDisplayName} · {EXCHANGE_CONDITION_LABELS[product.condition]}
      </Text>
      <Text style={{ color: palette.brandTitle, marginTop: 4 }}>
        {product.isSwapOnly ? 'Takaslık' : formatTryCurrency(product.price)}
      </Text>
      {showOffer ? (
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: palette.button, opacity: isMutating ? 0.6 : 1 }]}
          disabled={isMutating}
          onPress={() => {
            setSelectedProduct(product);
            setOfferType(product.isSwapOnly ? EXCHANGE_OFFER_TYPE.Swap : EXCHANGE_OFFER_TYPE.Buy);
            setOfferModalVisible(true);
          }}
        >
          <Text style={{ color: palette.buttonText, fontWeight: '700' }}>Teklif Ver</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  return (
    <View>
      <Text style={[styles.heading, { color: palette.text }]}>TerraTakas</Text>
      <View style={styles.tabs}>
        {(
          [
            ['market', 'Pazar'],
            ['mine', 'İlanlarım'],
            ['offers', 'Teklifler']
          ] as const
        ).map(([key, label]) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.tab,
              {
                backgroundColor: view === key ? palette.secondaryContainer : palette.mutedCard,
                borderColor: palette.outlineVariant
              }
            ]}
            onPress={() => setView(key)}
          >
            <Text style={{ color: palette.text, fontWeight: view === key ? '700' : '500' }}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {error ? <StateMessage tone="error" text={error} color={palette.text} /> : null}
      {success ? <StateMessage text={success} color={palette.brandTitle} /> : null}
      {loading ? <Text style={{ color: palette.subText }}>Yükleniyor…</Text> : null}

      {view === 'market' && !loading ? (
        <ScrollView>{products.map((p) => renderProductCard(p, true))}</ScrollView>
      ) : null}

      {view === 'mine' && !loading ? (
        <ScrollView>
          <View style={[styles.card, { backgroundColor: palette.mutedCard, borderColor: palette.border }]}>
            <Text style={[styles.title, { color: palette.text }]}>Yeni ilan</Text>
            <TextInput
              style={[styles.input, { color: palette.text, borderColor: palette.border }]}
              placeholder="Başlık"
              placeholderTextColor={palette.subText}
              value={newTitle}
              editable={!isMutating}
              onChangeText={setNewTitle}
            />
            <TextInput
              style={[styles.input, { color: palette.text, borderColor: palette.border }]}
              placeholder="Açıklama"
              placeholderTextColor={palette.subText}
              value={newDescription}
              editable={!isMutating}
              onChangeText={setNewDescription}
            />
            <TextInput
              style={[styles.input, { color: palette.text, borderColor: palette.border }]}
              placeholder="Fiyat (0=takas)"
              placeholderTextColor={palette.subText}
              keyboardType="decimal-pad"
              value={newPrice}
              editable={!isMutating}
              onChangeText={setNewPrice}
            />
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: palette.productCtaBg, borderColor: palette.productCtaBorder }]}
              disabled={isMutating}
              onPress={() => void pickListingPhoto()}
            >
              <Text style={{ color: palette.productCtaFg }}>Galeriden fotoğraf seç</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: palette.button, marginTop: 8, opacity: isMutating ? 0.6 : 1 }]}
              disabled={isMutating}
              onPress={() => void createListing()}
            >
              <Text style={{ color: palette.buttonText, fontWeight: '700' }}>
                {isMutating ? 'Kaydediliyor…' : 'İlanı yayınla'}
              </Text>
            </TouchableOpacity>
          </View>
          {myProducts.map((p) => renderProductCard(p, false))}
        </ScrollView>
      ) : null}

      {view === 'offers' && !loading ? (
        <ScrollView>
          <Text style={[styles.subHeading, { color: palette.text }]}>Gelen teklifler</Text>
          {received.map((offer) => (
            <View
              key={offer.id}
              style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}
            >
              <Text style={{ color: palette.text, fontWeight: '700' }}>{offer.productTitle}</Text>
              <Text style={{ color: palette.subText }}>
                {offer.senderDisplayName} · {EXCHANGE_OFFER_TYPE_LABELS[offer.offerType]}
              </Text>
              <Text style={{ color: palette.subText }}>{offer.message}</Text>
              <Text style={{ color: palette.subText }}>
                {EXCHANGE_OFFER_STATUS_LABELS[offer.status]}
              </Text>
              {offer.status === EXCHANGE_OFFER_STATUS.Pending ? (
                <View style={styles.row}>
                  <TouchableOpacity
                    style={[styles.btn, { backgroundColor: palette.button, flex: 1, opacity: isMutating ? 0.6 : 1 }]}
                    disabled={isMutating}
                    onPress={() => void respondOffer(offer.id, true)}
                  >
                    <Text style={{ color: palette.buttonText }}>Kabul</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btn, { backgroundColor: palette.mutedCard, flex: 1, opacity: isMutating ? 0.6 : 1 }]}
                    disabled={ isMutating}
                    onPress={() => void respondOffer(offer.id, false)}
                  >
                    <Text style={{ color: palette.text }}>Red</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          ))}
          <Text style={[styles.subHeading, { color: palette.text, marginTop: 16 }]}>Gönderdiğim</Text>
          {sent.map((offer) => (
            <View
              key={`sent-${offer.id}`}
              style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}
            >
              <Text style={{ color: palette.text }}>{offer.productTitle}</Text>
              <Text style={{ color: palette.subText }}>
                {EXCHANGE_OFFER_STATUS_LABELS[offer.status]}
              </Text>
            </View>
          ))}
        </ScrollView>
      ) : null}

      <Modal visible={offerModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: palette.card }]}>
            <Text style={[styles.title, { color: palette.text }]}>Teklif türü</Text>
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.tab, { backgroundColor: offerType === EXCHANGE_OFFER_TYPE.Swap ? palette.button : palette.mutedCard }]}
                disabled={isMutating}
                onPress={() => setOfferType(EXCHANGE_OFFER_TYPE.Swap)}
              >
                <Text style={{ color: offerType === EXCHANGE_OFFER_TYPE.Swap ? palette.buttonText : palette.text }}>
                  Takas
                </Text>
              </TouchableOpacity>
              {selectedProduct && !selectedProduct.isSwapOnly ? (
                <TouchableOpacity
                  style={[styles.tab, { backgroundColor: offerType === EXCHANGE_OFFER_TYPE.Buy ? palette.button : palette.mutedCard }]}
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
              style={[styles.input, { color: palette.text, borderColor: palette.border }]}
              placeholder="Mesajınız"
              placeholderTextColor={palette.subText}
              multiline
              value={offerMessage}
              editable={!isMutating}
              onChangeText={setOfferMessage}
            />
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: palette.button, opacity: isMutating ? 0.6 : 1 }]}
              disabled={isMutating}
              onPress={() => void submitOffer()}
            >
              <Text style={{ color: palette.buttonText, fontWeight: '700' }}>
                {isMutating ? 'Gönderiliyor…' : 'Gönder'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 8 }} disabled={isMutating} onPress={() => setOfferModalVisible(false)}>
              <Text style={{ color: palette.subText, textAlign: 'center' }}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  subHeading: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tab: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth },
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 12, marginBottom: 12 },
  thumb: { width: '100%', height: 140, borderRadius: 8, marginBottom: 8 },
  title: { fontSize: 16, fontWeight: '700' },
  btn: { marginTop: 10, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, alignItems: 'center', borderWidth: StyleSheet.hairlineWidth },
  input: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, padding: 10, marginTop: 8 },
  row: { flexDirection: 'row', gap: 8, marginTop: 8 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCard: { padding: 20, borderTopLeftRadius: 16, borderTopRightRadius: 16 }
});
