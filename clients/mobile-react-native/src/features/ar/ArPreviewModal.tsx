import React from 'react';
import { Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { MobilePalette, ThemeMode } from '../app/types';
import { getPalette } from '../../theme/mobileTheme';
import { ArPreviewResponse } from '../../types/ar';

const GLASS_BACKDROP_LIGHT = 'rgba(251, 248, 252, 0.92)';
const GLASS_BACKDROP_DARK = 'rgba(5, 20, 38, 0.88)';
const MODEL_PLACEHOLDER_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAqXerCQcEM5s5xv3UdAhFk8R5699FXEqbfWpB2d9CINEuBAdJ2f8WeHI_4FMkeAtTWnyRfZJZKxiHUhtR2DeEBQn9n_HPmM7X0AXZBJxIhYCrUcYN7XvFP1OVgraJ8rPKFnJVVxpB6eYeueSOSxdo0cEfGOcAvZikXdvc7oB8eAA3UUMtBLWy8uf2tSFfv29DtUGl2_1GbbZwe7iFcxe_RQVtCUXTzaW5BhOpkXtBop-2RP5SfKDNqEuv-kRsqTxe237UnFkvNxi38';

interface ArPreviewModalProps {
  visible: boolean;
  preview: ArPreviewResponse | null;
  onStartAr: () => void;
  onClose: () => void;
  themeMode?: ThemeMode;
  palette?: MobilePalette;
}

export function ArPreviewModal({
  visible,
  preview,
  onStartAr,
  onClose,
  themeMode = 'light',
  palette: paletteProp
}: ArPreviewModalProps): React.JSX.Element {
  const palette = paletteProp ?? getPalette(themeMode);
  const isLight = themeMode === 'light';
  const borderSoft = `${palette.outlineVariant}4D`;

  const backdrop = isLight ? GLASS_BACKDROP_LIGHT : GLASS_BACKDROP_DARK;
  const cardBg = palette.surfaceLowest;
  const disclaimerBg = isLight ? palette.bottomNav : palette.elevatedSurface;
  const formatBadgeBg = isLight ? 'rgba(48, 48, 51, 0.82)' : 'rgba(213, 227, 253, 0.12)';
  const formatBadgeFg = isLight ? '#f3f0f4' : palette.text;
  const previewImgOpacity = isLight ? 0.92 : 0.85;
  const scanLineBg = isLight ? `${palette.primaryContainer}66` : 'rgba(134, 239, 172, 0.42)';
  const scanShadow = isLight ? palette.primaryContainer : '#86efac';

  const subtitle = preview?.productName ?? 'Ürün';
  const formatLabel = preview?.modelFormat ? `${preview.modelFormat} biçimi` : 'glTF biçimi';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[stitchStyles.backdrop, { backgroundColor: backdrop }]}>
        <View style={stitchStyles.cardWrap}>
          <View
            style={[
              stitchStyles.card,
              {
                backgroundColor: cardBg,
                borderColor: borderSoft
              }
            ]}
          >
            <View style={[stitchStyles.header, { borderBottomColor: `${palette.outlineVariant}33` }]}>
              <View style={stitchStyles.headerText}>
                <Text style={[stitchStyles.title, { color: palette.text }]}>AR önizleme</Text>
                <Text style={[stitchStyles.subtitle, { color: palette.subText }]} numberOfLines={1}>
                  {subtitle}
                </Text>
              </View>
              <TouchableOpacity
                style={stitchStyles.closeRound}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="AR önizlemeyi kapat"
              >
                <Text style={{ color: palette.subText, fontSize: 22, fontWeight: '300' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={stitchStyles.previewPad}>
              <View
                style={[
                  stitchStyles.previewFrame,
                  {
                    backgroundColor: palette.mutedCard,
                    borderColor: palette.outlineVariant
                  }
                ]}
              >
                <Image
                  source={{ uri: MODEL_PLACEHOLDER_URI }}
                  style={[stitchStyles.previewImg, { opacity: previewImgOpacity }]}
                  resizeMode="contain"
                  accessibilityIgnoresInvertColors
                />
                <View style={[stitchStyles.formatBadge, { backgroundColor: formatBadgeBg }]}>
                  <Text style={{ fontSize: 14, color: formatBadgeFg }}>⎔</Text>
                  <Text style={[stitchStyles.formatBadgeText, { color: formatBadgeFg }]}>{formatLabel}</Text>
                </View>
                <View
                  style={[
                    stitchStyles.scanLine,
                    {
                      backgroundColor: scanLineBg,
                      shadowColor: scanShadow
                    }
                  ]}
                />
              </View>
            </View>

            <View style={stitchStyles.footer}>
              <View style={[stitchStyles.disclaimer, { backgroundColor: disclaimerBg }]}>
                <Text style={{ fontSize: 16, color: palette.subText }}>ⓘ</Text>
                <Text style={[stitchStyles.disclaimerText, { color: palette.subText }]}>
                  {`AR görüntüsü yalnızca mekânsal referans içindir. Ölçek doğruluğu cihaz kamerası kalibrasyonu ve ışık koşullarına bağlıdır.`}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  stitchStyles.primaryBtn,
                  { backgroundColor: palette.primaryContainer },
                  !preview && stitchStyles.btnDisabled
                ]}
                disabled={!preview}
                onPress={onStartAr}
                accessibilityRole="button"
                accessibilityLabel="AR deneyimini başlat"
              >
                <Text style={{ fontSize: 18, color: palette.onPrimaryContainer }}>▶</Text>
                <Text style={[stitchStyles.primaryBtnText, { color: palette.onPrimaryContainer }]}>
                  AR deneyimini başlat
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[stitchStyles.secondaryBtn, { borderColor: palette.outlineVariant }]}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Önizlemeyi kapat"
              >
                <Text style={[stitchStyles.secondaryBtnText, { color: palette.text }]}>Önizlemeyi kapat</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const stitchStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16
  },
  cardWrap: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center'
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  headerText: { flex: 1, marginRight: 12 },
  title: { fontSize: 18, fontWeight: '600', lineHeight: 24, letterSpacing: -0.1 },
  subtitle: { fontSize: 12, fontWeight: '500', lineHeight: 16, letterSpacing: 0.01, marginTop: 2 },
  closeRound: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center'
  },
  previewPad: { padding: 16 },
  previewFrame: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center'
  },
  previewImg: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 16,
    bottom: 16
  },
  formatBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2
  },
  formatBadgeText: { fontSize: 12, fontWeight: '500', lineHeight: 16, letterSpacing: 0.01 },
  scanLine: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: '50%',
    height: 1,
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0
  },
  footer: { paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 10,
    borderRadius: 8
  },
  disclaimerText: { flex: 1, fontSize: 12, fontWeight: '500', lineHeight: 16, letterSpacing: 0.01 },
  primaryBtn: {
    minHeight: 44,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  primaryBtnText: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  btnDisabled: { opacity: 0.45 },
  secondaryBtn: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '600', lineHeight: 20 }
});
