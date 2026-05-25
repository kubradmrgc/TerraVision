import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { MobileSection } from '../features/app/types';

const ABBREV: Record<MobileSection, string> = {
  products: 'Pr',
  cart: 'Ca',
  orders: 'Or',
  appointments: 'Ap',
  care: 'Tk',
  exchange: 'Tt',
  events: 'Ev'
};

type Props = {
  section: MobileSection;
  active: boolean;
  activeBg: string;
  activeFg: string;
  inactiveFg: string;
  borderColor: string;
};

export function NavTabIcon({
  section,
  active,
  activeBg,
  activeFg,
  inactiveFg,
  borderColor
}: Props): React.JSX.Element {
  return (
    <View
      style={[
        styles.box,
        {
          backgroundColor: active ? activeBg : 'transparent',
          borderColor: active ? activeBg : borderColor
        }
      ]}
    >
      <Text style={[styles.text, { color: active ? activeFg : inactiveFg }]}>{ABBREV[section]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4
  },
  text: { fontSize: 10, fontWeight: '700', letterSpacing: -0.2 }
});
