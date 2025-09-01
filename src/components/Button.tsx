import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, HEIGHTS } from '../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const getButtonStyle = () => {
    const baseStyles: ViewStyle[] = [styles.button];

    // Size styles
    if (size === 'sm') { baseStyles.push(styles.smallButton); }
    if (size === 'lg') { baseStyles.push(styles.largeButton); }

    // Variant styles
    switch (variant) {
      case 'secondary':
        baseStyles.push(styles.secondaryButton);
        break;
      case 'success':
        baseStyles.push(styles.successButton);
        break;
      case 'danger':
        baseStyles.push(styles.dangerButton);
        break;
      default:
        baseStyles.push(styles.primaryButton);
    }

    // State styles
    if (disabled) { baseStyles.push(styles.disabledButton); }
    if (fullWidth) { baseStyles.push(styles.fullWidth); }
    if (style) { baseStyles.push(style); }

    return baseStyles;
  };

  const getTextStyle = () => {
    const baseStyles: TextStyle[] = [styles.buttonText];

    // Size text styles
    if (size === 'sm') { baseStyles.push(styles.smallButtonText); }
    if (size === 'lg') { baseStyles.push(styles.largeButtonText); }

    // Variant text styles
    if (variant === 'secondary') { baseStyles.push(styles.secondaryButtonText); }

    if (textStyle) { baseStyles.push(textStyle); }

    return baseStyles;
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={getTextStyle()}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: BORDER_RADIUS.MD,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    height: HEIGHTS.BUTTON,
    paddingHorizontal: SPACING.MD,
  },
  buttonText: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
  },

  // Size variants
  smallButton: {
    height: 36,
    paddingHorizontal: SPACING.SM,
  },
  smallButtonText: {
    fontSize: FONT_SIZES.SM,
  },
  largeButton: {
    height: 56,
    paddingHorizontal: SPACING.LG,
  },
  largeButtonText: {
    fontSize: FONT_SIZES.LG,
  },

  // Color variants
  primaryButton: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  secondaryButton: {
    backgroundColor: COLORS.INPUT_BACKGROUND,
    borderColor: COLORS.BORDER_DEFAULT,
  },
  secondaryButtonText: {
    color: COLORS.TEXT_PRIMARY,
  },
  successButton: {
    backgroundColor: COLORS.SUCCESS,
    borderColor: COLORS.SUCCESS,
  },
  dangerButton: {
    backgroundColor: COLORS.ERROR,
    borderColor: COLORS.ERROR,
  },

  // State variants
  disabledButton: {
    backgroundColor: COLORS.DISABLED,
    borderColor: COLORS.DISABLED,
    opacity: 0.6,
  },
  fullWidth: {
    flex: 1,
  },
});

export default Button;
