import React from 'react';
import { Image, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { terravisionLogo } from '../assets/brand';

type Props = {
  accentColor?: string;
  markColor: string;
  subtitleColor: string;
  size?: 'md' | 'sm';
  showSubtitle?: boolean;
};

export function BrandMark({
  markColor,
  subtitleColor,
  size = 'md',
  showSubtitle = true
}: Props): React.JSX.Element {
  const dim = size === 'sm' ? 44 : 60;

  return (
    <View style={styles.wrap}>
      <Image
        source={terravisionLogo as ImageSourcePropType}
        style={[styles.logo, { width: dim, height: dim }]}
        resizeMode="contain"
        accessibilityLabel="TerraVision"
      />
      {showSubtitle ? (
        <View style={styles.textCol}>
          <Text style={[styles.title, { color: markColor }]}>TerraVision</Text>
          <Text style={[styles.subtitle, { color: subtitleColor }]}>Platform</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center' },
  logo: {
    borderRadius: 999
  },
  textCol: { marginLeft: 12 },
  title: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  subtitle: { fontSize: 11, fontWeight: '600', letterSpacing: 1, marginTop: 1 }
});
