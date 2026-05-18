import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { mobileTypography } from '../theme/mobileTypography';

type Props = {
  tone?: 'default' | 'error' | 'loading';
  variant?: 'inline' | 'banner';
  text: string;
  color?: string;
  borderColor?: string;
  backgroundColor?: string;
};

export function StateMessage({
  tone = 'default',
  variant = 'inline',
  text,
  color,
  borderColor,
  backgroundColor
}: Props): React.JSX.Element {
  const textColor =
    color ?? (tone === 'error' ? '#b91c1c' : tone === 'loading' ? undefined : undefined);

  if (variant === 'banner') {
    return (
      <View
        style={[
          styles.banner,
          backgroundColor ? { backgroundColor } : tone === 'error' ? styles.bannerErrorBg : styles.bannerMutedBg,
          borderColor ? { borderColor } : tone === 'error' ? styles.bannerErrorBorder : styles.bannerMutedBorder
        ]}
      >
        <Text
          style={[
            styles.bannerText,
            mobileTypography.bodySm,
            tone === 'error' && styles.error,
            textColor ? { color: textColor } : null
          ]}
        >
          {text}
        </Text>
      </View>
    );
  }

  return (
    <Text
      style={[
        styles.base,
        mobileTypography.bodySm,
        tone === 'error' && styles.error,
        textColor ? { color: textColor } : null
      ]}
    >
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: { marginBottom: 8 },
  banner: {
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth
  },
  bannerMutedBg: { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
  bannerMutedBorder: { borderColor: 'rgba(0, 0, 0, 0.08)' },
  bannerErrorBg: { backgroundColor: '#fef2f2' },
  bannerErrorBorder: { borderColor: '#fecaca' },
  bannerText: { textAlign: 'center' },
  error: { color: '#b91c1c' }
});
