import React from 'react';
import { StyleSheet, Text, TouchableOpacity, type StyleProp, type ViewStyle } from 'react-native';
import type { ThemeMode } from '../features/app/types';

type Props = {
  themeMode: ThemeMode;
  onPress: () => void;
  color: string;
  borderColor: string;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
  size?: 'sm' | 'md';
};

/** Koyu modda güneş (açık temaya geç), açık modda ay (koyu temaya geç). */
export function themeToggleGlyph(themeMode: ThemeMode): string {
  return themeMode === 'dark' ? '☀️' : '🌙';
}

export function themeToggleAccessibilityLabel(themeMode: ThemeMode): string {
  return themeMode === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç';
}

export function ThemeToggleButton({
  themeMode,
  onPress,
  color,
  borderColor,
  backgroundColor,
  style,
  size = 'md'
}: Props): React.JSX.Element {
  const fontSize = size === 'sm' ? 16 : 18;

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        size === 'sm' && styles.chipSm,
        { borderColor, backgroundColor: backgroundColor ?? 'transparent' },
        style
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={themeToggleAccessibilityLabel(themeMode)}
    >
      <Text style={[styles.glyph, { color, fontSize }]}>{themeToggleGlyph(themeMode)}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  chipSm: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    minWidth: 36
  },
  glyph: {
    lineHeight: 22,
    textAlign: 'center'
  }
});
