import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native';
import { sectionLabels } from '../i18n/tr';
import { sectionIcons } from '../theme/mobileTheme';

type Props = {
  itemCount: number;
  active: boolean;
  onPress: () => void;
  color: string;
  borderColor: string;
  activeBg: string;
  activeFg: string;
  badgeBg: string;
  badgeText: string;
  style?: StyleProp<ViewStyle>;
};

export function CartHeaderButton({
  itemCount,
  active,
  onPress,
  color,
  borderColor,
  activeBg,
  activeFg,
  badgeBg,
  badgeText,
  style
}: Props): React.JSX.Element {
  const countLabel = itemCount > 99 ? '99+' : String(itemCount);

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        {
          borderColor: active ? activeBg : borderColor,
          backgroundColor: active ? activeBg : 'transparent'
        },
        style
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={sectionLabels.cart}
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.glyph, { color: active ? activeFg : color }]}>{sectionIcons.cart}</Text>
      {itemCount > 0 ? (
        <View style={[styles.badge, { backgroundColor: badgeBg, borderColor: active ? activeBg : borderColor }]}>
          <Text style={[styles.badgeText, { color: badgeText }]}>{countLabel}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center'
  },
  glyph: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center'
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 12
  }
});
