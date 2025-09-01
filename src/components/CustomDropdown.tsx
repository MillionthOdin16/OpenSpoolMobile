import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, HEIGHTS } from '../constants/theme';

export interface DropdownOption {
  label: string;
  value: string;
  hex?: string; // For color options
}

interface CustomDropdownProps {
  label?: string;
  data: DropdownOption[];
  value: string;
  onChange: (item: DropdownOption) => void;
  placeholder?: string;
  renderItem?: (item: DropdownOption) => JSX.Element;
  style?: ViewStyle;
  disabled?: boolean;
  error?: string;
  searchable?: boolean;
  maxHeight?: number;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  label,
  data,
  value,
  onChange,
  placeholder,
  renderItem,
  style,
  disabled = false,
  error,
  searchable = false,
  maxHeight = 300,
}) => {
  const defaultRenderItem = (item: DropdownOption) => {
    if (item.hex) {
      // Render color item with swatch
      return (
        <View style={styles.colorItem}>
          <View style={[styles.colorSwatch, { backgroundColor: `#${item.hex}` }]} />
          <Text style={styles.itemText}>{item.label}</Text>
        </View>
      );
    }

    return (
      <View style={styles.item}>
        <Text style={styles.itemText}>{item.label}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Dropdown
        style={[
          styles.dropdown,
          disabled && styles.disabledDropdown,
          error && styles.errorDropdown,
        ]}
        containerStyle={[styles.dropdownContainer, { maxHeight }]}
        data={data}
        labelField="label"
        valueField="value"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        renderItem={renderItem || defaultRenderItem}
        placeholderStyle={styles.placeholder}
        selectedTextStyle={styles.selectedText}
        itemContainerStyle={styles.itemContainer}
        activeColor={COLORS.INPUT_BACKGROUND}
        disable={disabled}
        search={searchable}
        searchPlaceholder={searchable ? 'Search...' : undefined}
        inputSearchStyle={styles.searchInput}
        flatListProps={{
          nestedScrollEnabled: true,
          scrollEnabled: true,
        }}
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
  dropdown: {
    height: HEIGHTS.INPUT,
    borderColor: COLORS.BORDER_DEFAULT,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.MD,
    paddingHorizontal: SPACING.SM,
    backgroundColor: COLORS.INPUT_BACKGROUND,
  },
  dropdownContainer: {
    borderRadius: BORDER_RADIUS.MD,
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderColor: COLORS.BORDER_DEFAULT,
    borderWidth: 1,
  },
  disabledDropdown: {
    backgroundColor: COLORS.DISABLED,
    opacity: 0.6,
  },
  errorDropdown: {
    borderColor: COLORS.ERROR,
  },
  placeholder: {
    color: COLORS.TEXT_PLACEHOLDER,
    fontSize: FONT_SIZES.MD,
  },
  selectedText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: FONT_SIZES.MD,
  },
  itemContainer: {
    backgroundColor: COLORS.CARD_BACKGROUND,
  },
  item: {
    padding: SPACING.SM,
  },
  itemText: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '500',
  },
  colorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.SM,
  },
  colorSwatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: SPACING.SM,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  searchInput: {
    backgroundColor: COLORS.INPUT_BACKGROUND,
    color: COLORS.TEXT_PRIMARY,
    borderRadius: BORDER_RADIUS.MD,
    borderColor: COLORS.BORDER_DEFAULT,
  },
  errorText: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.ERROR,
    marginTop: SPACING.XS,
  },
});

export default CustomDropdown;
