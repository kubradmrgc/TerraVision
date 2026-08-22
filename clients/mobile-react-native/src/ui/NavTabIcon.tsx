import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { MobileSection } from '../features/app/types';
import { sectionIcons } from '../theme/mobileTheme';

type Props = {
  section: MobileSection;
  active: boolean;
  activeBg: string;
  borderColor: string;
};

export function NavTabIcon({ section, active, activeBg, borderColor }: Props): React.JSX.Element {
  return (
    <View
      style={[
        styles.box,
        {
          backgroundColor: active ? activeBg : 'transparent',
          borderColor: active ? activeBg : borderColor
        }
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Text style={styles.icon}>{sectionIcons[section]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4
  },
  icon: {
    fontSize: 18,
    lineHeight: 22,
    textAlign: 'center'
  }
});
