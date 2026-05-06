import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { sectionIcons, sectionLabels } from '../../theme/mobileTheme';
import { useMobileAppController } from './useMobileAppController';
import { RealtimeStatusBadge } from '../realtime/RealtimeStatusBadge';
import { StateMessage } from '../../ui/StateMessage';
import { ProductsSection } from '../products/ProductsSection';
import { CartSection } from '../cart/CartSection';
import { OrdersSection } from '../orders/OrdersSection';
import { EventsSection } from '../realtime/EventsSection';

type Props = {
  controller: ReturnType<typeof useMobileAppController>;
};

export function MobileAppView({ controller }: Props): React.JSX.Element {
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

  if (!state.loggedIn) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]}>
        <View style={[styles.panelHeader, { backgroundColor: palette.header, borderColor: palette.border }]}>
          <View style={styles.topBar}>
            <View>
              <Text style={[styles.title, { color: palette.text }]}>TerraVision Mobile</Text>
              <Text style={[styles.subtitle, { color: palette.subText }]}>Field Console</Text>
            </View>
            <TouchableOpacity
              style={[styles.secondaryButton, styles.secondaryButtonNoMargin, { borderColor: palette.border }]}
              onPress={controller.toggleTheme}
            >
              <Text style={[styles.secondaryButtonText, { color: palette.text }]}>
                {state.themeMode === 'dark' ? '☀️ Light' : '🌙 Dark'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={[styles.card, styles.loginCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={[styles.sectionHeading, { color: palette.text }]}>Welcome Back</Text>
          <Text style={[styles.sectionHint, { color: palette.subText }]}>Continue with your TerraVision account.</Text>
          <TextInput
            style={[styles.input, { backgroundColor: palette.card, borderColor: palette.border, color: palette.text }]}
            placeholder="Email"
            placeholderTextColor={palette.subText}
            autoCapitalize="none"
            value={state.email}
            onChangeText={controller.setEmail}
          />
          <TextInput
            style={[styles.input, { backgroundColor: palette.card, borderColor: palette.border, color: palette.text }]}
            placeholder="Password"
            placeholderTextColor={palette.subText}
            secureTextEntry
            value={state.password}
            onChangeText={controller.setPassword}
          />
          <TouchableOpacity
            style={[styles.button, { backgroundColor: palette.button }, isLoginDisabled && styles.buttonDisabled]}
            disabled={isLoginDisabled}
            onPress={controller.handleLogin}
          >
            <Text style={[styles.buttonText, { color: palette.buttonText }]}>Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.panelHeader, { backgroundColor: palette.header, borderColor: palette.border }]}>
          <View style={styles.topBar}>
            <View>
              <Text style={[styles.title, { color: palette.text }]}>TerraVision Mobile</Text>
              <Text style={[styles.subtitle, { color: palette.subText }]}>Operations Center</Text>
            </View>
            <TouchableOpacity
              style={[styles.secondaryButton, styles.secondaryButtonNoMargin, { borderColor: palette.border }]}
              onPress={controller.toggleTheme}
            >
              <Text style={[styles.secondaryButtonText, { color: palette.text }]}>
                {state.themeMode === 'dark' ? '☀️ Light' : '🌙 Dark'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryButton, styles.secondaryButtonNoMargin, { borderColor: palette.border }]}
              onPress={controller.handleLogout}
            >
              <Text style={[styles.secondaryButtonText, { color: palette.text }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
        <RealtimeStatusBadge
          status={realtimeStatus}
          borderColor={palette.border}
          backgroundColor={palette.card}
          titleColor={palette.text}
          detailColor={palette.subText}
        />

        <View style={[styles.mobileNav, { backgroundColor: palette.card, borderColor: palette.border }]}>
          {(Object.keys(sectionLabels) as Array<keyof typeof sectionLabels>).map((section) => (
            <TouchableOpacity
              key={section}
              style={[styles.navButton, state.activeSection === section && activePillStyle]}
              onPress={() => controller.setActiveSection(section)}
            >
              <Text
                style={[
                  styles.navButtonText,
                  { color: palette.subText },
                  state.activeSection === section && activePillTextStyle
                ]}
              >
                {sectionIcons[section]} {sectionLabels[section]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

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
            isLoading={isCommerceLoading}
            errorMessage={orderErrorMessage ?? (commerceError ? 'Siparis verileri alinamadi.' : null)}
          />
        )}
        {state.activeSection === 'events' && (
          <EventsSection
            events={state.events}
            orderCreatedEvents={state.orderCreatedEvents}
            orderStatusEvents={state.orderStatusEvents}
            textColor={palette.text}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f7f7f7' },
  scrollContent: { paddingBottom: 24 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  panelHeader: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  subtitle: { fontSize: 12, fontWeight: '600', marginTop: 2, letterSpacing: 0.3 },
  mobileNav: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14, borderWidth: 1, borderRadius: 12, padding: 10 },
  navButton: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#ffffff' },
  navButtonText: { fontWeight: '600', color: '#374151', fontSize: 12 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  sectionHeading: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  sectionHint: { fontSize: 13, marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#d0d0d0', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10, backgroundColor: 'white' },
  button: { backgroundColor: '#2f7d32', paddingVertical: 11, paddingHorizontal: 12, borderRadius: 12, marginTop: 8 },
  buttonDisabled: { backgroundColor: '#9fb89f' },
  buttonText: { color: 'white', fontWeight: '600', textAlign: 'center' },
  card: { backgroundColor: 'white', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  loginCard: { marginTop: 18 },
  secondaryButton: { borderWidth: 1, borderColor: '#2f7d32', borderRadius: 10, paddingVertical: 8, marginBottom: 10 },
  secondaryButtonNoMargin: { marginBottom: 0 },
  secondaryButtonText: { color: '#2f7d32', fontWeight: '600', textAlign: 'center' }
});
