import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';
import { mobileTypography } from '../theme/mobileTypography';

type Props = TextInputProps & {
  label: string;
  borderColor: string;
  backgroundColor: string;
  textColor: string;
  labelColor: string;
  placeholderColor: string;
  accentColor: string;
  secureToggleColor: string;
};

export function FormField({
  label,
  borderColor,
  backgroundColor,
  textColor,
  labelColor,
  placeholderColor,
  accentColor,
  secureToggleColor,
  secureTextEntry,
  ...inputProps
}: Props): React.JSX.Element {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(Boolean(secureTextEntry));

  const border = focused ? accentColor : borderColor;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, mobileTypography.label, { color: labelColor }]}>{label}</Text>
      <View style={[styles.inputRow, { borderColor: border, backgroundColor }]}>
        <TextInput
          {...inputProps}
          style={[styles.input, mobileTypography.body, { color: textColor }]}
          placeholderTextColor={placeholderColor}
          secureTextEntry={hidden}
          onFocus={(e) => {
            setFocused(true);
            inputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            inputProps.onBlur?.(e);
          }}
        />
        {secureTextEntry ? (
          <TouchableOpacity
            onPress={() => setHidden((v) => !v)}
            style={styles.toggle}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
          >
            <Text style={[styles.toggleText, { color: secureToggleColor }]}>{hidden ? 'Show' : 'Hide'}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: { marginBottom: 6, marginLeft: 2 },
  inputRow: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14
  },
  input: { flex: 1, paddingVertical: 12 },
  toggle: { paddingLeft: 8, paddingVertical: 8 },
  toggleText: { fontSize: 12, fontWeight: '600' }
});
