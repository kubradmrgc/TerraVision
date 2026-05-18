import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  accentColor: string;
  markColor: string;
  subtitleColor: string;
  size?: 'md' | 'sm';
  showSubtitle?: boolean;
};

export function BrandMark({
  accentColor,
  markColor,
  subtitleColor,
  size = 'md',
  showSubtitle = true
}: Props): React.JSX.Element {
  const dim = size === 'sm' ? 36 : 48;
  const fontSize = size === 'sm' ? 14 : 17;

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.ring,
          {
            width: dim,
            height: dim,
            borderRadius: dim / 2,
            borderColor: accentColor
          }
        ]}
      >
        <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
        <Text style={[styles.monogram, { color: markColor, fontSize }]}>TV</Text>
      </View>
      {showSubtitle ? (
        <View style={styles.textCol}>
          <Text style={[styles.title, { color: markColor }]}>TerraVision</Text>
          <Text style={[styles.subtitle, { color: subtitleColor }]}>Mobile</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center' },
  ring: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)'
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3
  },
  monogram: { fontWeight: '800', letterSpacing: -0.5 },
  textCol: { marginLeft: 12 },
  title: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  subtitle: { fontSize: 11, fontWeight: '600', letterSpacing: 1, marginTop: 1 }
});
