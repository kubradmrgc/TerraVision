import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { mobileTypography } from '../theme/mobileTypography';

type Props = {
  title: string;
  subtitle?: string;
  titleColor: string;
  subtitleColor?: string;
  right?: React.ReactNode;
};

export function SectionHeader({
  title,
  subtitle,
  titleColor,
  subtitleColor,
  right
}: Props): React.JSX.Element {
  return (
    <View style={styles.row}>
      <View style={styles.textBlock}>
        <Text style={[styles.title, mobileTypography.screenTitle, { color: titleColor }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, mobileTypography.bodySm, { color: subtitleColor ?? titleColor }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14
  },
  textBlock: { flex: 1, marginRight: 12 },
  title: { fontSize: 20 },
  subtitle: { marginTop: 4, opacity: 0.9 },
  right: { flexShrink: 0, alignSelf: 'center' }
});
