import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

type Props = {
  status: 'connecting' | 'connected' | 'degraded' | 'offline';
  borderColor: string;
  backgroundColor: string;
  textColor: string;
};

export function RealtimeStatusBadge({ status, borderColor, backgroundColor, textColor }: Props): React.JSX.Element {
  return (
    <View style={[styles.container, { borderColor, backgroundColor }]}>
      <Text style={[styles.text, { color: textColor }]}>Realtime: {status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10
  },
  text: {
    fontSize: 12,
    fontWeight: '600'
  }
});
