import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { USER_ROLE } from '@terravision/shared';
import { mobileTypography } from '../../theme/mobileTypography';
import { StateMessage } from '../../ui/StateMessage';
import type { MobilePalette, ThemeMode, UserProfile } from '../app/types';

type Props = {
  profile: UserProfile | null;
  palette: MobilePalette;
  themeMode: ThemeMode;
  onToggleTheme: () => void;
  onLogout: () => void;
};

function roleLabel(role: number): string {
  switch (role) {
    case USER_ROLE.Admin:
      return 'Yönetici';
    case USER_ROLE.Consultant:
      return 'Saha danışmanı';
    case USER_ROLE.Customer:
      return 'Müşteri';
    default:
      return 'Kullanıcı';
  }
}

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

  const fullName = `${profile.firstName} ${profile.lastName}`.trim() || profile.email;

  return (
    <View style={styles.wrap}>
      <View style={[styles.identityCard, { backgroundColor: palette.card, borderColor: palette.outlineVariant }]}>
        <View style={[styles.avatar, { backgroundColor: palette.secondaryContainer }]}>
          <Text style={[styles.avatarText, { color: palette.onSecondaryContainer }]}>
            {initials(profile.firstName, profile.lastName)}
          </Text>
        </View>
        <Text style={[styles.name, mobileTypography.cardTitle, { color: palette.text }]}>{fullName}</Text>
        <Text style={[styles.email, mobileTypography.bodySm, { color: palette.subText }]}>{profile.email}</Text>
        <View style={[styles.rolePill, { backgroundColor: palette.primaryContainer }]}>
          <Text style={[styles.rolePillText, { color: palette.onPrimaryContainer }]}>{roleLabel(profile.role)}</Text>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.outlineVariant }]}>
        <Text style={[styles.cardLabel, { color: palette.subText }]}>HESAP BİLGİLERİ</Text>
        <InfoRow label="Ad Soyad" value={fullName} palette={palette} />
        <InfoRow label="E-posta" value={profile.email} palette={palette} />
        <InfoRow label="Rol" value={roleLabel(profile.role)} palette={palette} />
        <InfoRow label="Kullanıcı No" value={`#${profile.userId}`} palette={palette} last />
      </View>

      <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.outlineVariant }]}>
        <Text style={[styles.cardLabel, { color: palette.subText }]}>AYARLAR</Text>
        <TouchableOpacity
          style={[styles.settingRow, { borderBottomColor: palette.outlineVariant }]}
          onPress={onToggleTheme}
          accessibilityRole="button"
          accessibilityLabel="Temayı değiştir"
        >
          <Text style={[styles.settingLabel, { color: palette.text }]}>Tema</Text>
          <Text style={[styles.settingValue, { color: palette.brandTitle }]}>
            {themeMode === 'dark' ? 'Koyu → Açık' : 'Açık → Koyu'}
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
    <View style={[styles.infoRow, !last && { borderBottomColor: palette.outlineVariant, borderBottomWidth: StyleSheet.hairlineWidth }]}>
      <Text style={[styles.infoLabel, { color: palette.subText }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: palette.text }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  identityCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center'
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  avatarText: { fontSize: 26, fontWeight: '700', letterSpacing: 0.5 },
  name: { marginBottom: 4, textAlign: 'center' },
  email: { marginBottom: 12, textAlign: 'center' },
  rolePill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  rolePillText: { fontSize: 12, fontWeight: '700' },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 6
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12
  },
  infoLabel: { fontSize: 13, fontWeight: '500' },
  infoValue: { fontSize: 14, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
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
