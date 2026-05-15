import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { sectionIcons, sectionLabels } from '../../theme/mobileTheme';
import type { MobileSection } from './types';
import { useMobileAppController } from './useMobileAppController';
import { RealtimeStatusBadge } from '../realtime/RealtimeStatusBadge';
import { StateMessage } from '../../ui/StateMessage';
import { ProductsSection } from '../products/ProductsSection';
import { CartSection } from '../cart/CartSection';
import { OrdersSection } from '../orders/OrdersSection';
import { AppointmentsSection } from '../appointments/AppointmentsSection';
import { EventsSection } from '../realtime/EventsSection';

/** Stitch admin light hero (vertical farm / industrial); dimmed via overlay in RN. */
const ADMIN_LIGHT_HERO_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCLBYfd-R71WN-M2vx6_vYkiH-BbXpc6iwksKIrhxE2p5ijVO2FfpnHjbh1j7c5lmavq_DuLIP3qp36Ri9yES1WbiS-6ANSI2zyd9gF1D3FdSfeuFxWwMhfDjNJY-ikiShly1y3J5VLjGNASiqkfFEF_DY62MH5JdFsBw2tt7rUPKaPAecTuetv4DszaSOcVfMGF9rIBORBOmmb1pu8_-QL4dpyeTMj-eKaT4dxkafeAjLG6discBlb06LKBo50cIV_ckdncYNUtZUh';

/** Stitch admin dark hero (server rack / mint LEDs). */
const ADMIN_DARK_HERO_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBjUDULPtu2PC4wR0FoYy1h26-DqvZG4wPPPrPPqMgm1_uv_gvgM_rNsy5ciGvmIGZBrmWlDvytsh771MhYE95RFM6y8p5vLGCCvcdUNe-bMZvPS_-zPppLmLdA90EpXerAHgxIOMGx0eo95rXH_7sQ9LDQEhTK4FWqrChvlvKyNBSInpEXQ9Ywpdwn0y2PiLyyUEmi3NYEkl4U26u9yjeS69rrRRfj27UzR990xAbhNEOhyYgrMdeje-P0ByziiW9xGGZQUSQYQ971';

/** Industrial precision dark login (matches Stitch admin dark HTML). */
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

export function MobileAppView({ controller }: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [loginShowPassword, setLoginShowPassword] = useState(false);
  const {
    state,
    palette,
    isLoginDisabled,
    arPendingProducts,
    canUploadArModel,
    activePillStyle,
    activePillTextStyle,
    isCommerceLoading,
    commerceError,
    isCartMutating,
    isOrderMutating,
    cartErrorMessage,
    orderErrorMessage,
    orderSuccessMessage,
    arUploadErrorMessage,
    arUploadSuccessMessage,
    arUploadProgress,
    isArUploading,
    realtimeStatus
  } = controller;

  const bottomPad = Math.max(insets.bottom, 10) + 56;

  if (!state.loggedIn) {
    if (state.themeMode === 'dark') {
      const d = DARK_LOGIN;
      return (
        <SafeAreaView style={[styles.loginShell, { backgroundColor: d.bg }]} edges={['top', 'bottom']}>
          <ScrollView
            style={styles.darkAdminScroll}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.darkAdminScrollContent,
              { paddingBottom: Math.max(insets.bottom, 12) + 48 }
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.darkAdminHero}>
              <Image
                source={{ uri: ADMIN_DARK_HERO_URI }}
                style={[StyleSheet.absoluteFill, styles.darkAdminHeroImage]}
                resizeMode="cover"
              />
              <View style={styles.darkAdminHeroScrim} />
              <View style={styles.darkAdminHeroFade} />
              <View style={[styles.darkAdminHeroHeader, { paddingTop: Math.max(insets.top, 10) }]}>
                <View style={styles.darkAdminHeaderBrand}>
                  <Text style={[styles.darkAdminHeaderIcon, { color: d.mint }]}>📡</Text>
                  <Text style={[styles.darkAdminHeaderTitle, { color: d.mint }]}>TerraVision Mobile</Text>
                </View>
                <TouchableOpacity
                  onPress={controller.toggleTheme}
                  accessibilityRole="button"
                  accessibilityLabel="Switch to light theme"
                  style={styles.darkAdminThemeHit}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Text style={[styles.darkAdminThemeGlyph, { color: d.inputIcon }]}>☀</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.loginColumn, styles.darkAdminCardOverlap]}>
              <View
                style={[
                  styles.darkAdminCard,
                  { backgroundColor: d.card, borderColor: d.borderIndustrial, shadowColor: '#000' }
                ]}
              >
                <View style={styles.darkAdminCardHeader}>
                  <View style={[styles.darkAdminPill, { backgroundColor: d.pillBg, borderColor: d.pillBorder }]}>
                    <Text style={[styles.darkAdminPillText, { color: d.mint }]}>
                      Administrator access / Yönetici oturumu
                    </Text>
                  </View>
                  <Text style={[styles.darkAdminCardTitle, { color: d.white }]}>System Login</Text>
                  <Text style={[styles.darkAdminCardSubtitle, { color: d.muted }]}>
                    Authenticate to access environmental data streams.
                  </Text>
                </View>

                <View style={styles.loginFieldGroup}>
                  <Text style={[styles.darkAdminFieldLabel, { color: d.muted }]}>Work email</Text>
                  <View style={styles.inputIconRow}>
                    <Text style={[styles.darkAdminInputLeading, { color: d.inputIcon }]}>✉</Text>
                    <TextInput
                      style={[
                        styles.darkAdminInput,
                        {
                          borderColor: d.borderIndustrial,
                          color: d.text,
                          backgroundColor: d.inputBg
                        }
                      ]}
                      placeholder="admin@terravision.corp"
                      placeholderTextColor={d.inputIcon}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoCorrect={false}
                      value={state.email}
                      onChangeText={controller.setEmail}
                    />
                  </View>
                </View>

                <View style={styles.loginFieldGroup}>
                  <Text style={[styles.darkAdminFieldLabel, { color: d.muted }]}>Password</Text>
                  <View style={styles.inputIconRow}>
                    <Text style={[styles.darkAdminInputLeading, { color: d.inputIcon }]}>🔒</Text>
                    <TextInput
                      style={[
                        styles.darkAdminInput,
                        styles.darkAdminInputWithEye,
                        {
                          borderColor: d.borderIndustrial,
                          color: d.text,
                          backgroundColor: d.inputBg
                        }
                      ]}
                      placeholder="••••••••"
                      placeholderTextColor={d.muted}
                      secureTextEntry={!loginShowPassword}
                      value={state.password}
                      onChangeText={controller.setPassword}
                    />
                    <TouchableOpacity
                      style={styles.darkAdminPwEye}
                      onPress={() => setLoginShowPassword((v) => !v)}
                      accessibilityRole="button"
                      accessibilityLabel={loginShowPassword ? 'Hide password' : 'Show password'}
                    >
                      <Text style={[styles.darkAdminPwEyeText, { color: d.inputIcon }]}>
                        {loginShowPassword ? '🙈' : '👁'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.darkAdminActions}>
                  <TouchableOpacity
                    style={[
                      styles.darkAdminCta,
                      { backgroundColor: d.ctaMint },
                      isLoginDisabled && styles.buttonDisabled
                    ]}
                    disabled={isLoginDisabled}
                    onPress={controller.handleLogin}
                    accessibilityRole="button"
                    accessibilityLabel="Sign in as admin"
                  >
                    <Text style={[styles.darkAdminCtaLabel, { color: d.ctaNavy }]}>Sign in as admin</Text>
                    <Text style={[styles.darkAdminCtaArrow, { color: d.ctaNavy }]}>→</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert(
                        'Forgot password',
                        'Please contact your administrator to reset your password.'
                      )
                    }
                    accessibilityRole="button"
                    accessibilityLabel="Forgot password"
                  >
                    <Text style={[styles.darkAdminForgot, { color: d.muted }]}>Forgot password</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.darkAdminDisclaimer}>
                <Text style={[styles.darkAdminDisclaimerIcon, { color: d.muted }]}>ⓘ</Text>
                <Text style={[styles.darkAdminDisclaimerText, { color: d.muted }]}>
                  Restricted to TerraVision administrators. Unauthorized access is monitored.
                </Text>
              </View>
            </View>
          </ScrollView>

          <View
            style={[styles.darkAdminFooterBar, { paddingBottom: Math.max(insets.bottom, 12) }]}
            pointerEvents="box-none"
          >
            <Text style={[styles.darkAdminFooterText, { color: d.inputIcon }]}>
              Restricted access / Yetkili erişimi
            </Text>
          </View>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={[styles.loginShell, { backgroundColor: palette.bg }]} edges={['top', 'bottom']}>
        <View style={styles.adminLightHeroWrap} pointerEvents="none">
          <Image source={{ uri: ADMIN_LIGHT_HERO_URI }} style={styles.adminLightHeroImage} resizeMode="cover" />
          <View style={styles.adminLightHeroOverlay} />
        </View>
        <TouchableOpacity
          style={[styles.loginThemeFab, { top: Math.max(insets.top, 12) + 4, borderColor: palette.outlineVariant, backgroundColor: palette.card }]}
          onPress={controller.toggleTheme}
          accessibilityRole="button"
          accessibilityLabel="Toggle color theme"
        >
          <Text style={[styles.loginThemeFabText, { color: palette.text }]}>☾</Text>
        </TouchableOpacity>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.loginScrollContent, { paddingBottom: Math.max(insets.bottom, 12) + 56 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.loginColumn}>
            <View style={styles.loginBrand}>
              <View
                style={[
                  styles.adminLightLogoRing,
                  {
                    backgroundColor: palette.mutedCard,
                    borderColor: palette.outlineVariant,
                    shadowColor: '#000'
                  }
                ]}
              >
                <Text style={[styles.adminLightLogoGlyph, { color: palette.brandTitle }]}>📡</Text>
              </View>
              <Text style={[styles.loginDisplayTitle, { color: palette.brandTitle }]}>TerraVision Mobile</Text>
            </View>

            <View style={[styles.loginCard, { backgroundColor: palette.surfaceLowest, borderColor: palette.outlineVariant, shadowColor: '#000' }]}>
              <View style={styles.adminLightPillWrap}>
                <View style={[styles.adminLightPill, { backgroundColor: palette.bottomNav }]}>
                  <Text style={[styles.adminLightPillIcon, { color: palette.subText }]}>⚙</Text>
                  <Text style={[styles.adminLightPillLabel, { color: palette.subText }]}>
                    Administrator access
                  </Text>
                </View>
              </View>

              <View style={styles.loginFieldGroup}>
                <Text style={[styles.loginLabel, { color: palette.subText }]}>Work email</Text>
                <TextInput
                  style={[
                    styles.adminLightInput,
                    { borderColor: palette.outlineVariant, color: palette.text, backgroundColor: palette.surfaceLowest }
                  ]}
                  placeholder="admin@terravision.inc"
                  placeholderTextColor={palette.subText}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                  value={state.email}
                  onChangeText={controller.setEmail}
                />
              </View>

              <View style={styles.loginFieldGroup}>
                <Text style={[styles.loginLabel, { color: palette.subText }]}>Password</Text>
                <View style={styles.adminLightPwRow}>
                  <TextInput
                    style={[
                      styles.adminLightInput,
                      styles.adminLightInputWithEye,
                      { borderColor: palette.outlineVariant, color: palette.text, backgroundColor: palette.surfaceLowest }
                    ]}
                    placeholder="••••••••"
                    placeholderTextColor={palette.subText}
                    secureTextEntry={!loginShowPassword}
                    value={state.password}
                    onChangeText={controller.setPassword}
                  />
                  <TouchableOpacity
                    style={styles.adminLightPwEye}
                    onPress={() => setLoginShowPassword((v) => !v)}
                    accessibilityRole="button"
                    accessibilityLabel={loginShowPassword ? 'Hide password' : 'Show password'}
                  >
                    <Text style={[styles.adminLightPwEyeText, { color: palette.subText }]}>
                      {loginShowPassword ? '🙈' : '👁'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.adminLightCta,
                  { backgroundColor: palette.button },
                  isLoginDisabled && styles.buttonDisabled
                ]}
                disabled={isLoginDisabled}
                onPress={controller.handleLogin}
                accessibilityRole="button"
                accessibilityLabel="Sign in as admin"
              >
                <Text style={[styles.adminLightCtaLabel, { color: palette.buttonText }]}>Sign in as admin</Text>
              </TouchableOpacity>

              <View style={styles.adminLightForgotWrap}>
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert('Forgot password', 'Please contact your administrator to reset your password.')
                  }
                  accessibilityRole="button"
                  accessibilityLabel="Forgot password"
                >
                  <Text style={[styles.adminLightForgotLabel, { color: palette.subText }]}>Forgot password</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View
              style={[
                styles.adminLightNotice,
                {
                  backgroundColor: 'rgba(246,242,247,0.92)',
                  borderColor: palette.outlineVariant
                }
              ]}
            >
              <Text style={[styles.adminLightNoticeIcon, { color: palette.subText }]}>ⓘ</Text>
              <Text style={[styles.adminLightNoticeText, { color: palette.subText }]}>
                Restricted to TerraVision administrators.
              </Text>
            </View>
          </View>
        </ScrollView>

        <View
          style={[styles.adminLightFooterBar, { paddingBottom: Math.max(insets.bottom, 12) }]}
          pointerEvents="box-none"
        >
          <Text style={[styles.adminLightFooterText, { color: palette.subText }]}>Restricted access</Text>
          <TouchableOpacity
            style={styles.adminLightFooterInfo}
            onPress={() => Alert.alert('Restricted access', 'This application is limited to authorized TerraVision personnel.')}
            accessibilityRole="button"
            accessibilityLabel="More information"
          >
            <Text style={[styles.adminLightFooterInfoIcon, { color: palette.subText }]}>ⓘ</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.loggedShell, { backgroundColor: palette.bg }]} edges={['top']}>
      <View style={[styles.stickyHeader, { backgroundColor: palette.header, borderBottomColor: palette.outlineVariant }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerTitleCluster}>
            <Text style={styles.loginHeaderIcon}>📡</Text>
            <Text style={[styles.brandTitleSingle, { color: palette.brandTitle }]}>TerraVision Mobile</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.headerRightPillWrap}>
              <RealtimeStatusBadge
                variant="compact"
                status={realtimeStatus}
                borderColor={palette.border}
                backgroundColor={palette.card}
                titleColor={palette.text}
                detailColor={palette.subText}
                compactBackground={palette.realtimeCapsuleBg}
                compactText={palette.realtimeCapsuleLabelColor}
                compactBorderColor={palette.realtimeCapsuleBorder}
                compactDotColor={palette.realtimeCapsuleDotColor}
              />
            </View>
            <TouchableOpacity
              style={[styles.ghostBtn, styles.headerGhostTight, { borderColor: palette.outlineVariant }]}
              onPress={controller.toggleTheme}
            >
              <Text style={[styles.ghostBtnText, { color: palette.subText }]}>{state.themeMode === 'dark' ? '☀' : '☾'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={controller.handleLogout} accessibilityRole="button" accessibilityLabel="Logout">
              <Text style={[styles.logoutText, { color: palette.subText }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollFlex}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad }]}
        keyboardShouldPersistTaps="handled"
      >
        {state.activeSection === 'events' && (
          <RealtimeStatusBadge
            status={realtimeStatus}
            borderColor={palette.border}
            backgroundColor={palette.card}
            titleColor={palette.text}
            detailColor={palette.subText}
          />
        )}

        {isCommerceLoading && <StateMessage text="Yukleniyor..." color={palette.subText} />}
        {commerceError && <StateMessage tone="error" text="Veri alinamadi. Lutfen tekrar deneyin." />}
        {orderSuccessMessage && <StateMessage text={orderSuccessMessage} color={palette.text} />}

        {state.activeSection === 'products' && (
          <ProductsSection
            products={state.products}
            isAdmin={state.isAdmin}
            arPendingProducts={arPendingProducts}
            selectedUploadProductId={state.selectedUploadProductId}
            selectedUploadFile={state.selectedUploadFile}
            canUploadArModel={canUploadArModel}
            isArUploading={isArUploading}
            arUploadProgress={arUploadProgress}
            arUploadErrorMessage={arUploadErrorMessage}
            arUploadSuccessMessage={arUploadSuccessMessage}
            palette={palette}
            onAddToCart={controller.handleAddToCart}
            onPreviewAr={controller.handlePreviewAr}
            onPickArFile={controller.handlePickArFile}
            onUploadArModel={controller.handleUploadArModel}
            onClearSelectedArFile={controller.handleClearSelectedArFile}
            onSelectUploadProduct={controller.setSelectedUploadProductId}
          />
        )}
        {state.activeSection === 'cart' && (
          <CartSection
            cart={state.cart}
            palette={palette}
            themeMode={state.themeMode}
            isLoading={isCommerceLoading}
            isMutating={isCartMutating || isOrderMutating}
            errorMessage={cartErrorMessage}
            onPlaceOrder={controller.handlePlaceOrder}
            onClearCart={controller.handleClearCart}
            onDecrease={controller.handleDecreaseQuantity}
            onIncrease={controller.handleIncreaseQuantity}
            onRemove={controller.handleRemoveItem}
          />
        )}
        {state.activeSection === 'orders' && (
          <OrdersSection
            orders={state.orders}
            palette={palette}
            themeMode={state.themeMode}
            isLoading={isCommerceLoading}
            errorMessage={orderErrorMessage ?? (commerceError ? 'Siparis verileri alinamadi.' : null)}
          />
        )}
        {state.activeSection === 'appointments' && (
          <AppointmentsSection
            appointments={state.appointments}
            role={state.role}
            palette={palette}
            themeMode={state.themeMode}
            isLoading={isCommerceLoading}
            isMutating={controller.isAppointmentMutating}
            consultantIdInput={controller.appointmentConsultantId}
            appointmentDateInput={controller.appointmentDateTime}
            appointmentNotesInput={controller.appointmentNotes}
            appointmentFilterStatus={controller.appointmentFilterStatus}
            appointmentErrorMessage={controller.appointmentErrorMessage}
            appointmentSuccessMessage={controller.appointmentSuccessMessage}
            onConsultantIdChange={controller.setAppointmentConsultantId}
            onAppointmentDateChange={controller.setAppointmentDateTime}
            onAppointmentNotesChange={controller.setAppointmentNotes}
            onAppointmentFilterChange={controller.setAppointmentFilterStatus}
            onCreateAppointment={controller.handleCreateAppointment}
            onUpdateStatus={controller.handleUpdateAppointmentStatus}
            errorMessage={commerceError ? 'Randevu verileri alinamadi.' : null}
            totalAppointmentsCount={controller.totalAppointmentsCount}
            pendingAppointmentsCount={controller.pendingAppointmentsCount}
            completedAppointmentsCount={controller.completedAppointmentsCount}
            averageAppointmentDurationMins={controller.averageAppointmentDurationMins}
          />
        )}
        {state.activeSection === 'events' && (
          <EventsSection
            events={state.events}
            orderCreatedEvents={state.orderCreatedEvents}
            orderStatusEvents={state.orderStatusEvents}
            palette={palette}
            themeMode={state.themeMode}
            activeCartQuantity={(state.cart?.items ?? []).reduce((sum, line) => sum + line.quantity, 0)}
          />
        )}
      </ScrollView>

      <View
        style={[
          styles.bottomNav,
          {
            backgroundColor: palette.bottomNav,
            borderTopColor: palette.border,
            paddingBottom: Math.max(insets.bottom, 8),
            shadowColor: '#000'
          }
        ]}
      >
        {(Object.keys(sectionLabels) as MobileSection[]).map((section) => {
          const active = state.activeSection === section;
          return (
            <TouchableOpacity
              key={section}
              style={[styles.bottomNavItem, active && activePillStyle]}
              onPress={() => controller.setActiveSection(section)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={sectionLabels[section]}
            >
              <Text style={styles.bottomNavIcon}>{sectionIcons[section]}</Text>
              <Text
                style={[
                  styles.bottomNavLabel,
                  { color: palette.navInactive },
                  active && activePillTextStyle
                ]}
              >
                {sectionLabels[section]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loginShell: { flex: 1 },
  darkAdminScroll: { flex: 1 },
  darkAdminScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 0
  },
  darkAdminHero: {
    height: 192,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: -32
  },
  darkAdminHeroImage: { opacity: 0.4 },
  darkAdminHeroScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(5, 20, 38, 0.52)'
  },
  darkAdminHeroFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 88,
    backgroundColor: '#051426',
    opacity: 0.94
  },
  darkAdminHeroHeader: {
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
  darkAdminHeaderBrand: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  darkAdminHeaderIcon: { fontSize: 22, marginRight: 8 },
  darkAdminHeaderTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.2, flexShrink: 1 },
  darkAdminThemeHit: { padding: 8, borderRadius: 999 },
  darkAdminThemeGlyph: { fontSize: 22, fontWeight: '600' },
  darkAdminCardOverlap: { zIndex: 2 },
  darkAdminCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    width: '100%',
    marginBottom: 8,
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6
  },
  darkAdminCardHeader: { alignItems: 'center', marginBottom: 12 },
  darkAdminPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 12,
    maxWidth: '100%'
  },
  darkAdminPillText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  darkAdminCardTitle: { fontSize: 22, fontWeight: '600', marginBottom: 6, textAlign: 'center' },
  darkAdminCardSubtitle: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  darkAdminFieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4, marginLeft: 4 },
  darkAdminInputLeading: { position: 'absolute', left: 12, top: 14, fontSize: 18, zIndex: 1 },
  darkAdminInput: {
    minHeight: 48,
    paddingLeft: 40,
    paddingRight: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 15
  },
  darkAdminInputWithEye: { paddingRight: 48 },
  darkAdminPwEye: {
    position: 'absolute',
    right: 2,
    top: 0,
    bottom: 0,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center'
  },
  darkAdminPwEyeText: { fontSize: 18 },
  darkAdminActions: { marginTop: 8, alignItems: 'center', width: '100%' },
  darkAdminCta: {
    width: '100%',
    minHeight: 48,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginTop: 4,
    shadowColor: '#86efac',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3
  },
  darkAdminCtaLabel: { fontSize: 14, fontWeight: '700' },
  darkAdminCtaArrow: { fontSize: 18, marginLeft: 8, fontWeight: '700' },
  darkAdminForgot: { fontSize: 12, fontWeight: '600', marginTop: 12, paddingVertical: 8 },
  darkAdminDisclaimer: {
    flexDirection: 'row',
    marginTop: 20,
    maxWidth: 320,
    alignSelf: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 4
  },
  darkAdminDisclaimerIcon: { fontSize: 14, marginRight: 6, marginTop: 2 },
  darkAdminDisclaimerText: { fontSize: 11, lineHeight: 16, flex: 1, flexShrink: 1, textAlign: 'center' },
  darkAdminFooterBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 8,
    paddingHorizontal: 16,
    zIndex: 10,
    backgroundColor: 'transparent'
  },
  darkAdminFooterText: { fontSize: 11, fontWeight: '500' },
  loginBgLayer: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
  loginBlobTR: {
    position: 'absolute',
    top: -48,
    right: -56,
    width: 280,
    height: 220,
    borderRadius: 200,
    opacity: 0.22
  },
  loginBlobBL: {
    position: 'absolute',
    bottom: -72,
    left: -48,
    width: 260,
    height: 260,
    borderRadius: 200,
    opacity: 0.18
  },
  loginThemeFab: {
    position: 'absolute',
    right: 16,
    zIndex: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3
  },
  loginThemeFabText: { fontSize: 18, fontWeight: '600' },
  loginScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32
  },
  loginColumn: { width: '100%', maxWidth: 400, alignSelf: 'center' },
  loginBrand: { alignItems: 'center', marginBottom: 28 },
  loginLogoTile: {
    width: 64,
    height: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4
  },
  loginLogoGlyph: { fontSize: 30 },
  loginDisplayTitle: { fontSize: 24, fontWeight: '600', letterSpacing: -0.5, textAlign: 'center' },
  loginFieldConsole: { fontSize: 18, fontWeight: '600', marginTop: 6, letterSpacing: -0.2, textAlign: 'center' },
  loginCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    width: '100%',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3
  },
  loginFieldGroup: { marginBottom: 16 },
  loginLabel: { fontSize: 12, fontWeight: '500', marginBottom: 8 },
  loginPasswordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  loginForgotLink: { fontSize: 12, fontWeight: '600' },
  inputIconRow: { position: 'relative' },
  inputLeadingIcon: { position: 'absolute', left: 14, top: 14, fontSize: 18, zIndex: 1 },
  loginInput: {
    minHeight: 48,
    paddingLeft: 48,
    paddingRight: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 15
  },
  loginSubmitBtn: {
    marginTop: 8,
    minHeight: 48,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2
  },
  loginSubmitIcon: { fontSize: 18, marginRight: 8 },
  loginSubmitLabel: { fontSize: 14, fontWeight: '600' },
  loginDividerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 22, marginBottom: 4 },
  loginDividerLine: { flex: 1, height: StyleSheet.hairlineWidth },
  loginDividerCap: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginHorizontal: 10 },
  loginSsoBtn: {
    marginTop: 8,
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16
  },
  loginSsoIcon: { fontSize: 18, marginRight: 8 },
  loginSsoLabel: { fontSize: 14, fontWeight: '600' },
  loginFooter: { marginTop: 28, alignItems: 'center', paddingHorizontal: 8 },
  loginTagline: { fontSize: 12, lineHeight: 17, textAlign: 'center', maxWidth: 280, opacity: 0.85 },
  loginTrustRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  loginTrustIcon: { fontSize: 15, marginRight: 6, fontWeight: '800' },
  loginTrustCaption: { fontSize: 11, fontWeight: '600' },

  adminLightHeroWrap: { ...StyleSheet.absoluteFill, zIndex: 0 },
  adminLightHeroImage: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  adminLightHeroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(251, 248, 252, 0.78)'
  },
  adminLightLogoRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  adminLightLogoGlyph: { fontSize: 30 },
  adminLightPillWrap: { alignItems: 'center', marginBottom: 20 },
  adminLightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    maxWidth: '100%'
  },
  adminLightPillIcon: { fontSize: 14, marginRight: 6 },
  adminLightPillLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.4, flexShrink: 1 },
  adminLightInput: {
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 16
  },
  adminLightPwRow: { position: 'relative' },
  adminLightInputWithEye: { paddingRight: 48 },
  adminLightPwEye: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 48,
    alignItems: 'center',
    justifyContent: 'center'
  },
  adminLightPwEyeText: { fontSize: 18 },
  adminLightCta: {
    marginTop: 8,
    minHeight: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2
  },
  adminLightCtaLabel: { fontSize: 14, fontWeight: '600' },
  adminLightForgotWrap: { alignItems: 'center', marginTop: 8, minHeight: 44, justifyContent: 'center' },
  adminLightForgotLabel: { fontSize: 12, fontWeight: '600' },
  adminLightNotice: {
    marginTop: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth
  },
  adminLightNoticeIcon: { fontSize: 14, marginRight: 6 },
  adminLightNoticeText: { fontSize: 11, fontWeight: '500', flexShrink: 1 },
  adminLightFooterBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingHorizontal: 16,
    zIndex: 10,
    backgroundColor: 'transparent'
  },
  adminLightFooterText: { fontSize: 11, fontWeight: '500' },
  adminLightFooterInfo: {
    marginLeft: 6,
    padding: 6,
    borderRadius: 999
  },
  adminLightFooterInfoIcon: { fontSize: 14 },

  loggedShell: { flex: 1 },
  scrollFlex: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 12 },
  stickyHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    zIndex: 20
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitleCluster: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  loginHeaderIcon: { fontSize: 22, marginRight: 8 },
  brandTitleSingle: { fontSize: 20, fontWeight: '600', letterSpacing: -0.3, flexShrink: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' },
  headerRightPillWrap: { marginRight: 8 },
  headerGhostTight: { marginRight: 8 },
  ghostBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    minWidth: 40,
    alignItems: 'center'
  },
  ghostBtnText: { fontSize: 13, fontWeight: '600' },
  logoutText: { fontSize: 14, fontWeight: '600' },
  buttonDisabled: { opacity: 0.55 },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: -2 },
    elevation: 8
  },
  bottomNavItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    minWidth: 56
  },
  bottomNavIcon: { fontSize: 20, marginBottom: 2 },
  bottomNavLabel: { fontSize: 11, fontWeight: '600' }
});
