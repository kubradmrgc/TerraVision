import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  label: string;
  backgroundColor: string;
  textColor: string;
  borderColor?: string;
  size?: 'sm' | 'md';
};

export function FeedIconBadge({
  label,
  backgroundColor,
  textColor,
  borderColor,
  size = 'md'
}: Props): React.JSX.Element {
  const dim = size === 'sm' ? 32 : 40;
  return (
    <View
      style={[
        styles.box,
        {
          width: dim,
          height: dim,
          borderRadius: dim / 4,
          backgroundColor,
          borderColor: borderColor ?? backgroundColor
        }
      ]}
    >
      <Text style={[styles.text, size === 'sm' && styles.textSm, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center'
  },
  text: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
  textSm: { fontSize: 10 }
});
