import React from 'react';
import { ActivityIndicator, Text, View, StyleSheet } from 'react-native';

export type RealtimeBadgeStatus = 'connecting' | 'connected' | 'degraded' | 'offline';

type Props = {
  status: RealtimeBadgeStatus;
  borderColor: string;
  backgroundColor: string;
  titleColor: string;
  detailColor: string;
  /** Compact pill for app header (Stitch-style) */
  variant?: 'default' | 'compact';
  compactBackground?: string;
  compactText?: string;
  compactBorderColor?: string;
  compactDotColor?: string;
};

const STATUS_COPY: Record<
  RealtimeBadgeStatus,
  { title: string; subtitle: string; shortTitle: string; accent: string; accessibility: string; showSpinner: boolean }
> = {
  connected: {
    title: 'Canli baglanti',
    subtitle: 'Olaylar aninda guncellenir; sepet/siparis otomatik yenilenir.',
    shortTitle: 'Connected',
    accent: '#16a34a',
    accessibility: 'Realtime baglanti durumu: bagli. Olaylar canli akmaya devam ediyor.',
    showSpinner: false
  },
  connecting: {
    title: 'Sunucuya baglaniliyor',
    subtitle: 'Hub aciliyor... Kisa sure icinde hazir olur.',
    shortTitle: 'Connecting',
    accent: '#ca8a04',
    accessibility: 'Realtime baglanti durumu: baglaniyor.',
    showSpinner: true
  },
  degraded: {
    title: 'Yeniden baglaniyor veya yedek kanal',
    subtitle: 'Mobil ag kesintisi: WebSocket sonrasi uzun yoklama kullanilabilir.',
    shortTitle: 'Degraded',
    accent: '#ea580c',
    accessibility:
      'Realtime baglanti durumu: zayif veya yeniden baglaniyor. Veriler yine de REST ile guncellenebilir.',
    showSpinner: true
  },
  offline: {
    title: 'Realtime kapali',
    subtitle: 'Giris yok veya baglanti kapandi. Liste asagida cache/elle yenile ile calisir.',
    shortTitle: 'Offline',
    accent: '#dc2626',
    accessibility: 'Realtime baglanti durumu: cevrimdisi.',
    showSpinner: false
  }
};

export function RealtimeStatusBadge({
  status,
  borderColor,
  backgroundColor,
  titleColor,
  detailColor,
  variant = 'default',
  compactBackground,
  compactText,
  compactBorderColor,
  compactDotColor
}: Props): React.JSX.Element {
  const meta = STATUS_COPY[status];
  const spinnerColor = meta.accent;

  if (variant === 'compact') {
    const pillBg = compactBackground ?? '#8cf5b2';
    const pillText = compactText ?? '#007241';
    const pillBorder = compactBorderColor ?? pillBg;
    const dotColor = compactDotColor ?? pillText;
    return (
      <View
        style={[
          styles.compactOuter,
          {
            backgroundColor: pillBg,
            borderColor: pillBorder
          }
        ]}
        accessibilityRole="text"
        accessibilityLabel={meta.accessibility}
      >
        {meta.showSpinner ? (
          <ActivityIndicator size="small" color={spinnerColor} style={styles.compactSpinner} accessibilityLabel="Baglaniyor" />
        ) : (
          <View style={[styles.compactDot, { backgroundColor: dotColor }]} />
        )}
        <Text style={[styles.compactLabel, { color: pillText }]}>{meta.shortTitle}</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          borderColor,
          backgroundColor,
          borderLeftColor: meta.accent
        }
      ]}
      accessibilityRole="summary"
      accessibilityLabel={meta.accessibility}
    >
      <View style={styles.row}>
        {meta.showSpinner && (
          <ActivityIndicator size="small" color={spinnerColor} style={styles.spinner} accessibilityLabel="Baglaniyor" />
        )}
        <View style={styles.labels}>
          <Text style={[styles.title, { color: titleColor }]}>{meta.title}</Text>
          <Text style={[styles.subtitle, { color: detailColor }]}>{meta.subtitle}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  compactOuter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1
  },
  compactDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  compactSpinner: { marginRight: 6 },
  compactLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  container: {
    borderWidth: 1,
    borderLeftWidth: 4,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  spinner: {
    marginRight: 10,
    marginTop: 2
  },
  labels: {
    flex: 1
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    opacity: 0.85,
    lineHeight: 15
  }
});
