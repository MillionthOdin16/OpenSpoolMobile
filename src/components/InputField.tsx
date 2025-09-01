import React from 'react';
import { View, Text, TextInput, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, HEIGHTS } from '../constants/theme';

interface InputFieldProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  multiline?: boolean;
  numberOfLines?: number;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  disabled?: boolean;
  error?: string;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  multiline = false,
  numberOfLines,
  style,
  inputStyle,
  disabled = false,
  error,
}) => {
  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          multiline && styles.multilineInput,
          disabled && styles.disabledInput,
          error && styles.errorInput,
          inputStyle,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.TEXT_PLACEHOLDER}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        editable={!disabled}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.MD,
  },
  label: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.XS,
    fontWeight: '500',
  },
  input: {
    height: HEIGHTS.INPUT,
    borderColor: COLORS.BORDER_DEFAULT,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.MD,
    paddingHorizontal: SPACING.SM,
    backgroundColor: COLORS.INPUT_BACKGROUND,
    color: COLORS.TEXT_PRIMARY,
    fontSize: FONT_SIZES.MD,
  },
  multilineInput: {
    height: undefined,
    minHeight: HEIGHTS.INPUT * 2,
    paddingTop: SPACING.SM,
    textAlignVertical: 'top',
  },
  disabledInput: {
    backgroundColor: COLORS.DISABLED,
    opacity: 0.6,
  },
  errorInput: {
    borderColor: COLORS.ERROR,
  },
  errorText: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.ERROR,
    marginTop: SPACING.XS,
  },
});

export default InputField;
