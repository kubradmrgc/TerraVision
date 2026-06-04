import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { USER_ROLE } from '@terravision/shared';
import { mobileTypography } from '../../theme/mobileTypography';
import { StateMessage } from '../../ui/StateMessage';
import { themeToggleAccessibilityLabel, themeToggleGlyph } from '../../ui/ThemeToggleButton';
import type { AppointmentDto } from '../../types/appointment';
import type { OrderDto } from '../../types/order';
import type { MobilePalette, ThemeMode, UserProfile } from '../app/types';
import { ProfileOrdersHistorySection } from './ProfileOrdersHistorySection';

type Props = {
  profile: UserProfile | null;
  palette: MobilePalette;
  themeMode: ThemeMode;
  role: number | null;
  orders: OrderDto[];
  appointments: AppointmentDto[];
  isCommerceLoading: boolean;
  orderErrorMessage: string | null;
  onToggleTheme: () => void;
  onLogout: () => void;
};

function initials(firstName: string, lastName: string): string {
  const first = firstName.trim().charAt(0);
  const last = lastName.trim().charAt(0);
  const value = `${first}${last}`.toUpperCase();
  return value || '👤';
}

export function ProfileSection({
  profile,
  palette,
  themeMode,
  role,
  orders,
  appointments,
  isCommerceLoading,
  orderErrorMessage,
  onToggleTheme,
  onLogout
}: Props): React.JSX.Element {
  if (!profile) {
    return (
      <StateMessage
        variant="banner"
        text="Profil bilgisi bulunamadı. Lütfen tekrar giriş yapın."
        color={palette.subText}
        backgroundColor={palette.mutedCard}
        borderColor={palette.outlineVariant}
      />
    );
  }

  const showOrdersBlock = role === USER_ROLE.Customer;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.hubTitle, mobileTypography.screenTitle, { color: palette.text }]}>Hesabım</Text>
      <Text style={[styles.hubLead, { color: palette.subText }]}>
        Kişisel bilgileriniz, sipariş ve randevu geçmişiniz.
      </Text>

      <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.outlineVariant }]}>
        <View style={styles.cardHeaderRow}>
          <View style={[styles.avatar, { backgroundColor: palette.secondaryContainer }]}>
            <Text style={[styles.avatarText, { color: palette.onSecondaryContainer }]}>
              {initials(profile.firstName, profile.lastName)}
            </Text>
          </View>
          <Text style={[styles.cardHeading, { color: palette.text }]}>Bilgilerim</Text>
        </View>
        <InfoRow label="Ad" value={profile.firstName.trim() || '—'} palette={palette} />
        <InfoRow label="Soyad" value={profile.lastName.trim() || '—'} palette={palette} />
        <InfoRow label="E-posta" value={profile.email} palette={palette} last />
      </View>

      {showOrdersBlock ? (
        <ProfileOrdersHistorySection
          orders={orders}
          appointments={appointments}
          palette={palette}
          isLoading={isCommerceLoading}
          errorMessage={orderErrorMessage}
        />
      ) : null}

      <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.outlineVariant }]}>
        <Text style={[styles.cardLabel, { color: palette.subText }]}>AYARLAR</Text>
        <TouchableOpacity
          style={[styles.settingRow, { borderBottomColor: palette.outlineVariant }]}
          onPress={onToggleTheme}
          accessibilityRole="button"
          accessibilityLabel={themeToggleAccessibilityLabel(themeMode)}
        >
          <Text style={[styles.settingLabel, { color: palette.text }]}>Tema</Text>
          <Text style={[styles.settingValue, { color: palette.brandTitle }]}>
            {themeToggleGlyph(themeMode)}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.logoutBtn, { borderColor: palette.stockLowPillBorder, backgroundColor: palette.stockLowPillBg }]}
        onPress={onLogout}
        accessibilityRole="button"
        accessibilityLabel="Çıkış yap"
      >
        <Text style={[styles.logoutText, { color: palette.stockLowPillText }]}>Çıkış yap</Text>
      </TouchableOpacity>
    </View>
  );
}

function InfoRow({
  label,
  value,
  palette,
  last
}: {
  label: string;
  value: string;
  palette: MobilePalette;
  last?: boolean;
}): React.JSX.Element {
  return (
    <View
      style={[
        styles.infoRow,
        !last && { borderBottomColor: palette.outlineVariant, borderBottomWidth: StyleSheet.hairlineWidth }
      ]}
    >
      <Text style={[styles.infoLabel, { color: palette.subText }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: palette.text }]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  hubTitle: { marginBottom: 4 },
  hubLead: { fontSize: 14, lineHeight: 20, marginBottom: 4 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8
  },
  cardHeading: { fontSize: 17, fontWeight: '700' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: { fontSize: 16, fontWeight: '700' },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 6
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    gap: 12
  },
  infoLabel: { fontSize: 13, fontWeight: '500', minWidth: 72 },
  infoValue: { fontSize: 14, fontWeight: '600', flex: 1, textAlign: 'right' },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12
  },
  settingLabel: { fontSize: 14, fontWeight: '600' },
  settingValue: { fontSize: 13, fontWeight: '700' },
  logoutBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center'
  },
  logoutText: { fontSize: 15, fontWeight: '700' }
});
