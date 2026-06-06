import React from 'react';
import { StyleSheet, Text, TouchableOpacity, type StyleProp, type ViewStyle } from 'react-native';
import type { MobileSection } from '../features/app/types';
import { sectionLabels } from '../i18n/tr';
import { sectionIcons } from '../theme/mobileTheme';

type Props = {
  section: MobileSection;
  active: boolean;
  onPress: () => void;
  color: string;
  borderColor: string;
  activeBg: string;
  activeFg: string;
  style?: StyleProp<ViewStyle>;
};

export function SectionHeaderButton({
  section,
  active,
  onPress,
  color,
  borderColor,
  activeBg,
  activeFg,
  style
}: Props): React.JSX.Element {
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
      accessibilityLabel={sectionLabels[section]}
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.glyph, { color: active ? activeFg : color }]}>{sectionIcons[section]}</Text>
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
  }
});
