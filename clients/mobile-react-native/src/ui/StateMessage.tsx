import React from 'react';
import { Text, StyleSheet } from 'react-native';

type Props = {
  tone?: 'default' | 'error';
  text: string;
  color?: string;
};

export function StateMessage({ tone = 'default', text, color }: Props): React.JSX.Element {
  return <Text style={[styles.base, tone === 'error' && styles.error, color ? { color } : null]}>{text}</Text>;
}

const styles = StyleSheet.create({
  base: {
    fontSize: 13,
    marginBottom: 6
  },
  error: {
    color: '#b91c1c'
  }
});
