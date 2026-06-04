import React from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { mobileTypography } from '../../theme/mobileTypography';
import { BrandMark } from '../../ui/BrandMark';
import { ThemeToggleButton } from '../../ui/ThemeToggleButton';
import { FormField } from '../../ui/FormField';
import { PrimaryButton } from '../../ui/PrimaryButton';
import {
  getMobileLoginPortalConfig,
  MOBILE_LOGIN_PORTALS,
  MOBILE_STAFF_PORTALS,
  type LoginPortalUiConfig
} from '../auth/loginPortalConfig';
import type { useMobileAppController } from '../app/useMobileAppController';

const ADMIN_LIGHT_HERO_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCLBYfd-R71WN-M2vx6_vYkiH-BbXpc6iwksKIrhxE2p5ijVO2FfpnHjbh1j7c5lmavq_DuLIP3qp36Ri9yES1WbiS-6ANSI2zyd9gF1D3FdSfeuFxWwMhfDjNJY-ikiShly1y3J5VLjGNASiqkfFEF_DY62MH5JdFsBw2tt7rUPKaPAecTuetv4DszaSOcVfMGF9rIBORBOmmb1pu8_-QL4dpyeTMj-eKaT4dxkafeAjLG6discBlb06LKBo50cIV_ckdncYNUtZUh';

const ADMIN_DARK_HERO_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBjUDULPtu2PC4wR0FoYy1h26-DqvZG4wPPPrPPqMgm1_uv_gvgM_rNsy5ciGvmIGZBrmWlDvytsh771MhYE95RFM6y8p5vLGCCvcdUNe-bMZvPS_-zPppLmLdA90EpXerAHgxIOMGx0eo95rXH_7sQ9LDQEhTK4FWqrChvlvKyNBSInpEXQ9Ywpdwn0y2PiLyyUEmi3NYEkl4U26u9yjeS69rrRRfj27UzR990xAbhNEOhyYgrMdeje-P0ByziiW9xGGZQUSQYQ971';

const DARK_LOGIN = {
  bg: '#051426',
  card: '#122033',
  inputBg: '#010f21',
  borderIndustrial: '#3e4a40',
  text: '#d5e3fd',
  muted: '#bdcabe',
  mint: '#dbffe2',
  ctaMint: '#86efac',
  ctaNavy: '#00391d',
  inputIcon: '#707970',
  white: '#ffffff',
  pillBorder: '#004c22',
  pillBg: 'rgba(0, 76, 34, 0.2)'
} as const;

type Props = {
  controller: ReturnType<typeof useMobileAppController>;
};

const PORTAL_CTA = 'Giriş yap ve alışverişe başla →';

export function MobileLoginFlow({ controller }: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const {
    state,
    palette,
    isLoginDisabled,
    isRegisterDisabled,
    setFirstName,
    setLastName,
    setConfirmPassword,
    setAuthMode,
    openCustomerRegister
  } = controller;
  const isRegisterMode = state.authMode === 'register' && state.loginPortal === 'customer';

  if (!state.loginPortal) {
    return (
      <SafeAreaView style={[styles.shell, { backgroundColor: palette.bg }]} edges={['top', 'bottom']}>
        <View style={[styles.portalHeader, { paddingTop: Math.max(insets.top, 8) }]}>
          <BrandMark
            accentColor={palette.brandTitle}
            markColor={palette.brandTitle}
            subtitleColor={palette.subText}
            size="sm"
          />
          <ThemeToggleButton
            themeMode={state.themeMode}
            onPress={controller.toggleTheme}
            color={palette.subText}
            borderColor={palette.outlineVariant}
            backgroundColor={palette.card}
          />
        </View>

        <ScrollView
          contentContainerStyle={[styles.portalScroll, { paddingBottom: Math.max(insets.bottom, 16) + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.portalTitle, mobileTypography.screenTitle, { color: palette.text }]}>
            Hoş geldiniz
          </Text>
          <Text style={[styles.portalSubtitle, mobileTypography.bodySm, { color: palette.subText }]}>
            Ürünleri keşfedin, sepetinizi oluşturun ve siparişlerinizi takip edin.
          </Text>

          {(() => {
            const customer = MOBILE_LOGIN_PORTALS.find((p) => p.portal === 'customer')!;
            return (
              <TouchableOpacity
                style={[
                  styles.portalCard,
                  styles.portalCardPrimary,
                  {
                    backgroundColor: palette.surfaceLowest,
                    borderColor: palette.brandTitle
                  }
                ]}
                onPress={() => controller.selectLoginPortal('customer')}
                accessibilityRole="button"
                accessibilityLabel={`${customer.title}. ${customer.subtitle}`}
              >
                <Text style={[styles.portalCardPill, mobileTypography.pill, { color: palette.brandTitle }]}>
                  {customer.pill}
                </Text>
                <Text style={[styles.portalCardTitle, mobileTypography.cardTitle, { color: palette.text }]}>
                  {customer.title}
                </Text>
                <Text style={[styles.portalCardBody, mobileTypography.bodySm, { color: palette.subText }]}>
                  {customer.subtitle}
                </Text>
                <View style={styles.featureList}>
                  {customer.features.map((feature) => (
                    <View key={feature} style={styles.featureRow}>
                      <View style={[styles.featureDot, { backgroundColor: palette.brandTitle }]} />
                      <Text style={[styles.featureText, mobileTypography.caption, { color: palette.subText }]}>
                        {feature}
                      </Text>
                    </View>
                  ))}
                </View>
                <View style={[styles.primaryCta, { backgroundColor: palette.button }]}>
                  <Text style={[styles.primaryCtaText, mobileTypography.label, { color: palette.buttonText }]}>
                    {PORTAL_CTA}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })()}

          <TouchableOpacity
            style={[styles.registerOutlineBtn, { borderColor: palette.outlineVariant }]}
            onPress={openCustomerRegister}
            accessibilityRole="button"
            accessibilityLabel="Yeni müşteri hesabı oluştur"
          >
            <Text style={[styles.registerOutlineBtnText, mobileTypography.label, { color: palette.brandTitle }]}>
              Hesabınız yok mu? Kayıt olun
            </Text>
          </TouchableOpacity>

          <View style={[styles.staffSection, { borderTopColor: palette.outlineVariant }]}>
            <Text style={[styles.staffLabel, mobileTypography.caption, { color: palette.subText }]}>
              Personel erişimi
            </Text>
            <View style={styles.staffLinks}>
              {MOBILE_STAFF_PORTALS.map((portal) => {
                const item = MOBILE_LOGIN_PORTALS.find((p) => p.portal === portal)!;
                return (
                  <TouchableOpacity
                    key={portal}
                    style={[styles.staffLink, { borderColor: palette.outlineVariant }]}
                    onPress={() => controller.selectLoginPortal(portal)}
                    accessibilityRole="button"
                    accessibilityLabel={item.title}
                  >
                    <Text style={[styles.staffLinkText, mobileTypography.caption, { color: palette.subText }]}>
                      {item.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const portalConfig = getMobileLoginPortalConfig(state.loginPortal);
  const isDark = state.themeMode === 'dark';
  const useAdminVisual = portalConfig.useAdminHero && isDark;
  const d = DARK_LOGIN;

  const renderForm = (config: LoginPortalUiConfig) => {
    const showRegister = state.loginPortal === 'customer' && isRegisterMode;
    const cardBg = useAdminVisual ? d.card : palette.surfaceLowest;
    const borderColor = useAdminVisual ? d.borderIndustrial : palette.outlineVariant;
    const titleColor = useAdminVisual ? d.white : palette.text;
    const subColor = useAdminVisual ? d.muted : palette.subText;
    const pillColor = useAdminVisual ? d.mint : palette.brandTitle;
    const pillBg = useAdminVisual ? d.pillBg : palette.mutedCard;
    const pillBorder = useAdminVisual ? d.pillBorder : palette.outlineVariant;
    const inputBg = useAdminVisual ? d.inputBg : palette.surfaceLowest;
    const accent = useAdminVisual ? d.ctaMint : palette.brandTitle;
    const ctaBg = useAdminVisual ? d.ctaMint : palette.button;
    const ctaFg = useAdminVisual ? d.ctaNavy : palette.buttonText;

    return (
      <View style={[styles.loginColumn, styles.cardOverlap]}>
        <View style={[styles.loginCard, { backgroundColor: cardBg, borderColor, shadowColor: '#000' }]}>
          <TouchableOpacity onPress={controller.clearLoginPortal} style={styles.backLink}>
            <Text style={[styles.backLinkText, mobileTypography.label, { color: subColor }]}>
              {state.loggedIn ? '← Giriş türünü değiştir' : '← Ürünlere dön'}
            </Text>
          </TouchableOpacity>

          <View style={styles.cardHeader}>
            <View style={[styles.pill, { backgroundColor: pillBg, borderColor: pillBorder }]}>
              <Text style={[styles.pillText, mobileTypography.pill, { color: pillColor }]}>{config.pill}</Text>
            </View>
            <Text style={[styles.cardTitle, mobileTypography.cardTitle, { color: titleColor }]}>
              {showRegister ? 'Hesap oluştur' : config.title}
            </Text>
            <Text style={[styles.cardSubtitle, mobileTypography.bodySm, { color: subColor }]}>
              {showRegister
                ? 'Kayıt sonrası web ve mobilde aynı hesapla giriş yapın; sepet ve siparişler senkronize kalır.'
                : config.subtitle}
            </Text>
          </View>

          {state.loginPortal === 'customer' ? (
            <View style={styles.authModeRow}>
              <TouchableOpacity
                onPress={() => setAuthMode('login')}
                style={[
                  styles.authModeChip,
                  {
                    borderColor,
                    backgroundColor: !showRegister ? pillBg : 'transparent'
                  }
                ]}
              >
                <Text style={[styles.authModeChipText, { color: !showRegister ? pillColor : subColor }]}>Giriş</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setAuthMode('register')}
                style={[
                  styles.authModeChip,
                  {
                    borderColor,
                    backgroundColor: showRegister ? pillBg : 'transparent'
                  }
                ]}
              >
                <Text style={[styles.authModeChipText, { color: showRegister ? pillColor : subColor }]}>Kayıt</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {showRegister ? (
            <>
              <FormField
                label="Ad"
                borderColor={borderColor}
                backgroundColor={inputBg}
                textColor={useAdminVisual ? d.text : palette.text}
                labelColor={subColor}
                placeholderColor={subColor}
                accentColor={accent}
                secureToggleColor={subColor}
                placeholder="Adınız"
                autoCapitalize="words"
                value={state.firstName}
                onChangeText={setFirstName}
              />
              <FormField
                label="Soyad"
                borderColor={borderColor}
                backgroundColor={inputBg}
                textColor={useAdminVisual ? d.text : palette.text}
                labelColor={subColor}
                placeholderColor={subColor}
                accentColor={accent}
                secureToggleColor={subColor}
                placeholder="Soyadınız"
                autoCapitalize="words"
                value={state.lastName}
                onChangeText={setLastName}
              />
            </>
          ) : null}

          <FormField
            label="E-posta"
            borderColor={borderColor}
            backgroundColor={inputBg}
            textColor={useAdminVisual ? d.text : palette.text}
            labelColor={subColor}
            placeholderColor={subColor}
            accentColor={accent}
            secureToggleColor={subColor}
            placeholder={config.emailPlaceholder}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
            value={state.email}
            onChangeText={controller.setEmail}
          />

          <FormField
            label="Şifre"
            borderColor={borderColor}
            backgroundColor={inputBg}
            textColor={useAdminVisual ? d.text : palette.text}
            labelColor={subColor}
            placeholderColor={subColor}
            accentColor={accent}
            secureToggleColor={subColor}
            placeholder={showRegister ? 'En az 8 karakter' : 'Şifrenizi girin'}
            secureTextEntry
            value={state.password}
            onChangeText={controller.setPassword}
          />

          {showRegister ? (
            <FormField
              label="Şifre (tekrar)"
              borderColor={borderColor}
              backgroundColor={inputBg}
              textColor={useAdminVisual ? d.text : palette.text}
              labelColor={subColor}
              placeholderColor={subColor}
              accentColor={accent}
              secureToggleColor={subColor}
              placeholder="Şifrenizi tekrar girin"
              secureTextEntry
              value={state.confirmPassword}
              onChangeText={setConfirmPassword}
            />
          ) : null}

          <View style={styles.actions}>
            <PrimaryButton
              label={showRegister ? 'Hesap oluştur' : config.submitLabel}
              trailing="→"
              onPress={showRegister ? controller.handleRegister : controller.handleLogin}
              backgroundColor={ctaBg}
              textColor={ctaFg}
              disabled={showRegister ? isRegisterDisabled : isLoginDisabled}
            />
            <TouchableOpacity
              onPress={() =>
                Alert.alert('Şifremi unuttum', 'Şifre sıfırlama için sistem yöneticinizle iletişime geçin.')
              }
            >
              <Text style={[styles.forgot, mobileTypography.label, { color: subColor }]}>Şifremi unuttum</Text>
            </TouchableOpacity>
          </View>
        </View>

        {config.notice ? (
          <View
            style={[
              styles.proNotice,
              {
                backgroundColor: useAdminVisual ? 'rgba(18, 32, 51, 0.85)' : palette.mutedCard,
                borderColor
              }
            ]}
          >
            <Text style={[styles.proNoticeText, mobileTypography.caption, { color: subColor }]}>{config.notice}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  if (useAdminVisual) {
    return (
      <SafeAreaView style={[styles.shell, { backgroundColor: d.bg }]} edges={['top', 'bottom']}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 12) + 48 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <Image source={{ uri: ADMIN_DARK_HERO_URI }} style={[StyleSheet.absoluteFill, styles.heroImageDim]} resizeMode="cover" />
            <View style={styles.heroScrim} />
            <View style={styles.heroFadeDark} />
            <View style={[styles.heroHeader, { paddingTop: Math.max(insets.top, 10) }]}>
              <BrandMark accentColor={d.ctaMint} markColor={d.mint} subtitleColor={d.muted} size="sm" />
              <ThemeToggleButton
                themeMode={state.themeMode}
                onPress={controller.toggleTheme}
                color={d.muted}
                borderColor={d.borderIndustrial}
              />
            </View>
          </View>
          {renderForm(portalConfig)}
        </ScrollView>
        {portalConfig.footer ? (
          <View style={[styles.footerBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <Text style={[styles.footerText, mobileTypography.caption, { color: d.inputIcon }]}>{portalConfig.footer}</Text>
          </View>
        ) : null}
      </SafeAreaView>
    );
  }

  if (portalConfig.useAdminHero) {
    return (
      <SafeAreaView style={[styles.shell, { backgroundColor: palette.bg }]} edges={['top', 'bottom']}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 12) + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <Image
              source={{ uri: ADMIN_LIGHT_HERO_URI }}
              style={[StyleSheet.absoluteFill, styles.heroImageLight]}
              resizeMode="cover"
            />
            <View style={styles.heroOverlayLight} />
            <View style={styles.heroFadeLight} />
            <View style={[styles.heroHeader, { paddingTop: Math.max(insets.top, 10) }]}>
              <BrandMark
                accentColor={palette.brandTitle}
                markColor={palette.brandTitle}
                subtitleColor={palette.subText}
                size="sm"
              />
              <ThemeToggleButton
                themeMode={state.themeMode}
                onPress={controller.toggleTheme}
                color={palette.subText}
                borderColor={palette.outlineVariant}
                backgroundColor={palette.card}
              />
            </View>
          </View>
          {renderForm(portalConfig)}
        </ScrollView>
        {portalConfig.footer ? (
          <View style={[styles.footerBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <Text style={[styles.footerText, mobileTypography.caption, { color: palette.subText }]}>
              {portalConfig.footer}
            </Text>
          </View>
        ) : null}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.shell, { backgroundColor: palette.bg }]} edges={['top', 'bottom']}>
      <View style={[styles.portalHeader, { paddingTop: Math.max(insets.top, 8) }]}>
        <BrandMark
          accentColor={palette.brandTitle}
          markColor={palette.brandTitle}
          subtitleColor={palette.subText}
          size="sm"
        />
        <ThemeToggleButton
          themeMode={state.themeMode}
          onPress={controller.toggleTheme}
          color={palette.subText}
          borderColor={palette.outlineVariant}
          backgroundColor={palette.card}
        />
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.portalScroll, { paddingBottom: Math.max(insets.bottom, 16) + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {renderForm(portalConfig)}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  portalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8
  },
  portalScroll: { paddingHorizontal: 16, paddingTop: 8 },
  portalTitle: { fontSize: 24, marginBottom: 8 },
  portalSubtitle: { marginBottom: 20 },
  portalCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12
  },
  portalCardPrimary: {
    borderWidth: 2,
    padding: 20,
    marginBottom: 20
  },
  primaryCta: {
    marginTop: 4,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center'
  },
  primaryCtaText: { fontWeight: '700' },
  staffSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: 'center'
  },
  staffLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontWeight: '600',
    marginBottom: 10
  },
  staffLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8
  },
  staffLink: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth
  },
  staffLinkText: { fontWeight: '500' },
  portalCardPill: { marginBottom: 8 },
  portalCardTitle: { marginBottom: 4 },
  portalCardBody: { marginBottom: 12 },
  featureList: { gap: 6, marginBottom: 14 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureDot: { width: 5, height: 5, borderRadius: 3 },
  featureText: {},
  portalCardCta: { fontWeight: '700' },
  registerOutlineBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8
  },
  registerOutlineBtnText: { fontWeight: '600' },
  authModeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12
  },
  authModeChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center'
  },
  authModeChipText: { fontSize: 13, fontWeight: '700' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 0 },
  hero: {
    height: 192,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: -32
  },
  heroImageDim: { opacity: 0.4 },
  heroImageLight: { opacity: 0.55 },
  heroOverlayLight: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(251, 248, 252, 0.72)' },
  heroFadeLight: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 88,
    backgroundColor: '#fbf8fc',
    opacity: 0.95
  },
  heroScrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(5, 20, 38, 0.52)' },
  heroFadeDark: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 88,
    backgroundColor: '#051426',
    opacity: 0.94
  },
  heroHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 4,
    minHeight: 48
  },
  themeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth
  },
  themeChipText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
  loginColumn: { width: '100%', maxWidth: 400, alignSelf: 'center' },
  cardOverlap: { zIndex: 2 },
  loginCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    width: '100%',
    marginBottom: 8,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6
  },
  backLink: { alignSelf: 'flex-start', marginBottom: 12 },
  backLinkText: {},
  cardHeader: { alignItems: 'center', marginBottom: 12 },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 12,
    maxWidth: '100%'
  },
  pillText: {},
  cardTitle: { marginBottom: 6, textAlign: 'center' },
  cardSubtitle: { textAlign: 'center' },
  actions: { marginTop: 8, alignItems: 'center', width: '100%' },
  forgot: { marginTop: 12, paddingVertical: 8 },
  proNotice: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth
  },
  proNoticeText: { textAlign: 'center' },
  footerBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingTop: 8,
    paddingHorizontal: 16
  },
  footerText: {}
});