import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { mobileTypography } from '../theme/mobileTypography';

type Props = {
  label: string;
  onPress: () => void;
  backgroundColor: string;
  textColor: string;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  trailing?: string;
};

export function PrimaryButton({
  label,
  onPress,
  backgroundColor,
  textColor,
  disabled,
  loading,
  style,
  trailing
}: Props): React.JSX.Element {
  return (
    <TouchableOpacity
      style={[
        styles.btn,
        { backgroundColor },
        (disabled || loading) && styles.disabled,
        style
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      activeOpacity={0.88}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          <Text style={[styles.label, mobileTypography.button, { color: textColor }]}>{label}</Text>
          {trailing ? <Text style={[styles.trail, { color: textColor }]}>{trailing}</Text> : null}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: 50,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3
  },
  disabled: { opacity: 0.5 },
  label: {},
  trail: { fontSize: 18, marginLeft: 8, fontWeight: '600' }
});
