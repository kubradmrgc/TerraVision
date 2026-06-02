import React from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ArSessionResponseDto, parseArEnvironmentNotes } from '@terravision/shared';
import { API_BASE_URL } from '../../config/env';
import type { MobilePalette } from '../app/types';
import { StateMessage } from '../../ui/StateMessage';

type Props = {
  sessions: ArSessionResponseDto[];
  palette: MobilePalette;
  isLoading: boolean;
  isRefreshing: boolean;
  errorMessage: string | null;
  onRefresh: () => void;
};

function resolveMediaUrl(path: string): string {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}

function formatSessionDate(iso: string): string {
  return new Date(iso).toLocaleString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function ArRoomsSection({
  sessions,
  palette,
  isLoading,
  isRefreshing,
  errorMessage,
  onRefresh
}: Props): React.JSX.Element {
  if (isLoading && sessions.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={palette.brandTitle} accessibilityLabel="AR odaları yükleniyor" />
        <Text style={[styles.loadingText, { color: palette.subText }]}>AR odalarınız yükleniyor…</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={[styles.headerCard, { backgroundColor: palette.card, borderColor: palette.outlineVariant }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>AR Odalarım</Text>
          <TouchableOpacity
            onPress={onRefresh}
            disabled={isRefreshing}
            accessibilityRole="button"
            accessibilityLabel="AR odalarını yenile"
          >
            <Text style={[styles.refreshLink, { color: palette.brandTitle }]}>
              {isRefreshing ? 'Yenileniyor…' : 'Yenile'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.sectionLead, { color: palette.subText }]}>
          AR deneyiminden kaydettiğiniz bitki yerleşimleri ve oda ekran görüntüleri.
        </Text>
        <Text style={[styles.countBadge, { color: palette.onPrimaryContainer, backgroundColor: palette.primaryContainer }]}>
          {sessions.length} kayıt
        </Text>
      </View>

      {errorMessage ? <StateMessage variant="banner" tone="error" text={errorMessage} /> : null}

      {!errorMessage && sessions.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: palette.mutedCard, borderColor: palette.outlineVariant }]}>
          <Text style={[styles.emptyTitle, { color: palette.text }]}>Henüz kayıtlı yerleşim yok</Text>
          <Text style={[styles.emptyBody, { color: palette.subText }]}>
            Ürünler sekmesinde AR deneyimini açın ve &quot;Tasarımı Odama Kaydet&quot; ile ilk odanızı oluşturun.
          </Text>
        </View>
      ) : null}

      {sessions.map((session) => (
        <View
          key={session.id}
          style={[styles.sessionCard, { backgroundColor: palette.card, borderColor: palette.outlineVariant }]}
        >
          <Image
            source={{ uri: resolveMediaUrl(session.screenshotUrl) }}
            style={[styles.screenshot, { backgroundColor: palette.imagePlaceholder }]}
            accessibilityLabel={`${session.productName} AR yerleşimi`}
          />
          <View style={styles.sessionBody}>
            <View style={styles.titleRow}>
              {session.productImageUrl ? (
                <Image
                  source={{ uri: resolveMediaUrl(session.productImageUrl) }}
                  style={[styles.productThumb, { backgroundColor: palette.imagePlaceholder }]}
                />
              ) : null}
              <Text style={[styles.productName, { color: palette.text }]} numberOfLines={2}>
                {session.productName}
              </Text>
            </View>
            <Text style={[styles.meta, { color: palette.subText }]}>
              {formatSessionDate(session.createdDate)} · {session.deviceModel}
            </Text>
            <Text style={[styles.scale, { color: palette.subText }]}>
              Ölçek X {session.scaleX} · Y {session.scaleY} · Z {session.scaleZ} · Dönüş {session.rotationY}°
            </Text>
            <Text style={[styles.notes, { color: palette.subText }]}>
              Ortam: {parseArEnvironmentNotes(session.environmentMetadata)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12, marginTop: 16 },
  centered: { alignItems: 'center', justifyContent: 'center', paddingVertical: 24, gap: 10 },
  loadingText: { fontSize: 14 },
  headerCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 8
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', flex: 1 },
  refreshLink: { fontSize: 14, fontWeight: '700' },
  sectionLead: { fontSize: 14, lineHeight: 20 },
  countBadge: {
    alignSelf: 'flex-start',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden'
  },
  emptyCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 6
  },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptyBody: { fontSize: 14, lineHeight: 20 },
  sessionCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden'
  },
  screenshot: { width: '100%', aspectRatio: 4 / 3 },
  sessionBody: { padding: 14, gap: 6 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  productThumb: { width: 40, height: 40, borderRadius: 8 },
  productName: { flex: 1, fontSize: 16, fontWeight: '700' },
  meta: { fontSize: 13 },
  scale: { fontSize: 13 },
  notes: { fontSize: 13 }
});
