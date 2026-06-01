import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { sectionLabels } from '../../theme/mobileTheme';
import { mobileTypography } from '../../theme/mobileTypography';
import type { MobileSection } from './types';
import { useMobileAppController } from './useMobileAppController';
import { MobileLoginFlow } from '../auth/MobileLoginFlow';
import { RealtimeStatusBadge } from '../realtime/RealtimeStatusBadge';
import { StateMessage } from '../../ui/StateMessage';
import { BrandMark } from '../../ui/BrandMark';
import { NavTabIcon } from '../../ui/NavTabIcon';
import { ProductsSection } from '../products/ProductsSection';
import { CartSection } from '../cart/CartSection';
import { OrdersSection } from '../orders/OrdersSection';
import { AppointmentsSection } from '../appointments/AppointmentsSection';
import { EventsSection } from '../realtime/EventsSection';
import { CareCalendarSection } from '../care/CareCalendarSection';
import { ExchangeSection } from '../exchange/ExchangeSection';
import { ProfileSection } from '../profile/ProfileSection';
import { USER_ROLE } from '@terravision/shared';

type Props = {
  controller: ReturnType<typeof useMobileAppController>;
};

export function MobileAppView({ controller }: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const {
    state,
    palette,
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
    return <MobileLoginFlow controller={controller} />;
  }

  return (
    <SafeAreaView style={[styles.loggedShell, { backgroundColor: palette.bg }]} edges={['top']}>
      <View style={[styles.stickyHeader, { backgroundColor: palette.header, borderBottomColor: palette.outlineVariant }]}>
        <View style={styles.headerRow}>
          <BrandMark
            accentColor={palette.brandTitle}
            markColor={palette.brandTitle}
            subtitleColor={palette.subText}
            size="sm"
          />
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
              style={[styles.themeChip, styles.headerGhostTight, { borderColor: palette.outlineVariant }]}
              onPress={controller.toggleTheme}
              accessibilityRole="button"
              accessibilityLabel="Toggle theme"
            >
              <Text style={[styles.themeChipText, { color: palette.subText }]}>
                {state.themeMode === 'dark' ? 'Light' : 'Dark'}
              </Text>
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

        {isCommerceLoading && (
          <StateMessage
            variant="banner"
            text="Loading data…"
            color={palette.subText}
            backgroundColor={palette.mutedCard}
            borderColor={palette.outlineVariant}
          />
        )}
        {commerceError && (
          <StateMessage variant="banner" tone="error" text="Could not load data. Please try again." />
        )}
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
            errorMessage={orderErrorMessage ?? (commerceError ? 'Could not load orders.' : null)}
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
            errorMessage={commerceError ? 'Could not load appointments.' : null}
            totalAppointmentsCount={controller.totalAppointmentsCount}
            pendingAppointmentsCount={controller.pendingAppointmentsCount}
            completedAppointmentsCount={controller.completedAppointmentsCount}
            averageAppointmentDurationMins={controller.averageAppointmentDurationMins}
          />
        )}
        {state.activeSection === 'care' && (
          <CareCalendarSection
            plants={controller.carePlants}
            palette={palette}
            isLoading={controller.isCommerceLoading}
            errorMessage={controller.careErrorMessage ?? (commerceError ? 'Bakım takvimi yüklenemedi.' : null)}
            successMessage={controller.careSuccessMessage}
            isMutating={controller.isCareMutating}
            mutatingKey={controller.careMutatingKey}
            onCompleteAction={controller.handleCompleteCareAction}
          />
        )}
        {state.activeSection === 'exchange' && <ExchangeSection palette={palette} />}
        {state.activeSection === 'profile' && (
          <ProfileSection
            profile={state.profile}
            palette={palette}
            themeMode={state.themeMode}
            onToggleTheme={controller.toggleTheme}
            onLogout={controller.handleLogout}
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
        {(Object.keys(sectionLabels) as MobileSection[])
          .filter((section) => section !== 'care' || state.role === USER_ROLE.Customer)
          .map((section) => {
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
              <NavTabIcon
                section={section}
                active={active}
                activeBg={palette.brandTitle}
                activeFg={palette.buttonText}
                inactiveFg={palette.navInactive}
                borderColor={palette.outlineVariant}
              />
              <Text
                style={[
                  styles.bottomNavLabel,
                  mobileTypography.navLabel,
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
  lightAdminHeroImage: { opacity: 0.55 },
  lightAdminHeroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(251, 248, 252, 0.72)'
  },
  lightAdminHeroFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 88,
    backgroundColor: '#fbf8fc',
    opacity: 0.95
  },
  themeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth
  },
  themeChipText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
  proNotice: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth
  },
  proNoticeText: { textAlign: 'center' },
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
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    zIndex: 20
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
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
    paddingTop: 10,
    paddingHorizontal: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12
  },
  bottomNavItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    minWidth: 58
  },
  bottomNavIcon: { fontSize: 20, marginBottom: 2 },
  bottomNavLabel: { fontSize: 11, fontWeight: '600' }
});
