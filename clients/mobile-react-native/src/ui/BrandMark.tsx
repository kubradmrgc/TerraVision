import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
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
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <View style={styles.wrap}>
      <View style={[styles.logoFrame, { width: dim, height: dim }]}>
        {imageFailed ? (
          <Text style={[styles.logoFallback, { color: markColor, fontSize: dim * 0.42 }]}>T</Text>
        ) : (
          <Image
            source={terravisionLogo}
            style={styles.logoImage}
            resizeMode="contain"
            accessibilityLabel="TerraVision"
            onError={() => setImageFailed(true)}
          />
        )}
      </View>
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
  logoFrame: {
    borderRadius: 12,
    backgroundColor: '#FBF8FC',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0, 76, 34, 0.12)'
  },
  logoImage: {
    width: '100%',
    height: '100%'
  },
  logoFallback: {
    fontWeight: '800'
  },
  textCol: { marginLeft: 12 },
  title: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  subtitle: { fontSize: 11, fontWeight: '600', letterSpacing: 1, marginTop: 1 }
});
