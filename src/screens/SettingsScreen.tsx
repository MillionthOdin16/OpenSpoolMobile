import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';

import Button from '../components/Button';
import CustomDropdown, { DropdownOption } from '../components/CustomDropdown';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import { StorageService } from '../services/StorageService';
import { tagProtocolService, TagProtocol } from '../services/TagProtocolService';

interface AppSettings {
  defaultProtocol: TagProtocol;
  enableHapticFeedback: boolean;
  enableSoundFeedback: boolean;
  autoConnect: boolean;
  defaultBrand: string;
  theme: 'dark' | 'light';
}

const SettingsScreen: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>({
    defaultProtocol: TagProtocol.OPENSPOOL,
    enableHapticFeedback: true,
    enableSoundFeedback: true,
    autoConnect: false,
    defaultBrand: 'Generic',
    theme: 'dark',
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // In a real app, these would be loaded from storage
      // For now, we'll use the default values
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load settings:', error);
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      // In a real app, these would be saved to storage
      Alert.alert('Settings Saved', 'Your preferences have been saved successfully.');
    } catch (error) {
      console.error('Failed to save settings:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    }
  };

  const resetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to their default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setSettings({
              defaultProtocol: TagProtocol.OPENSPOOL,
              enableHapticFeedback: true,
              enableSoundFeedback: true,
              autoConnect: false,
              defaultBrand: 'Generic',
              theme: 'dark',
            });
            Alert.alert('Settings Reset', 'All settings have been reset to their default values.');
          },
        },
      ]
    );
  };

  const clearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all stored printer settings and preferences. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.clearAllData();
              resetSettings();
              Alert.alert('Data Cleared', 'All application data has been cleared.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data. Please try again.');
            }
          },
        },
      ]
    );
  };

  const protocolOptions: DropdownOption[] = tagProtocolService.getAllProtocols().map(protocol => ({
    label: `${protocol.label} v${protocol.version}`,
    value: protocol.value,
  }));

  const brandOptions: DropdownOption[] = [
    { label: 'Generic', value: 'Generic' },
    { label: 'Bambu Lab', value: 'Bambu Lab' },
    { label: 'Prusa', value: 'Prusa' },
    { label: 'Hatchbox', value: 'Hatchbox' },
    { label: 'SUNLU', value: 'SUNLU' },
    { label: 'eSUN', value: 'eSUN' },
    { label: 'PETG', value: 'PETG' },
    { label: 'Other', value: 'Other' },
  ];

  const themeOptions: DropdownOption[] = [
    { label: 'Dark Theme', value: 'dark' },
    { label: 'Light Theme', value: 'light' },
  ];

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Customize your app experience</Text>
        </View>

        {/* NFC & Protocol Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NFC & Protocol</Text>
          
          <CustomDropdown
            label="Default Protocol"
            data={protocolOptions}
            value={settings.defaultProtocol}
            onChange={(item) => setSettings({ ...settings, defaultProtocol: item.value as TagProtocol })}
            placeholder="Select default protocol"
          />

          <CustomDropdown
            label="Default Brand"
            data={brandOptions}
            value={settings.defaultBrand}
            onChange={(item) => setSettings({ ...settings, defaultBrand: item.value })}
            placeholder="Select default brand"
          />
        </View>

        {/* App Behavior */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Behavior</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Haptic Feedback</Text>
              <Text style={styles.settingDescription}>
                Vibrate when scanning tags or performing actions
              </Text>
            </View>
            <Switch
              value={settings.enableHapticFeedback}
              onValueChange={(value) => setSettings({ ...settings, enableHapticFeedback: value })}
              thumbColor={settings.enableHapticFeedback ? COLORS.PRIMARY : COLORS.TEXT_SECONDARY}
              trackColor={{ false: COLORS.DISABLED, true: COLORS.PRIMARY + '40' }}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Sound Feedback</Text>
              <Text style={styles.settingDescription}>
                Play sounds when scanning or writing tags
              </Text>
            </View>
            <Switch
              value={settings.enableSoundFeedback}
              onValueChange={(value) => setSettings({ ...settings, enableSoundFeedback: value })}
              thumbColor={settings.enableSoundFeedback ? COLORS.PRIMARY : COLORS.TEXT_SECONDARY}
              trackColor={{ false: COLORS.DISABLED, true: COLORS.PRIMARY + '40' }}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Auto-connect to Printer</Text>
              <Text style={styles.settingDescription}>
                Automatically connect to the last used printer on app start
              </Text>
            </View>
            <Switch
              value={settings.autoConnect}
              onValueChange={(value) => setSettings({ ...settings, autoConnect: value })}
              thumbColor={settings.autoConnect ? COLORS.PRIMARY : COLORS.TEXT_SECONDARY}
              trackColor={{ false: COLORS.DISABLED, true: COLORS.PRIMARY + '40' }}
            />
          </View>
        </View>

        {/* Appearance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          
          <CustomDropdown
            label="Theme"
            data={themeOptions}
            value={settings.theme}
            onChange={(item) => setSettings({ ...settings, theme: item.value as 'dark' | 'light' })}
            placeholder="Select theme"
            disabled={true} // Light theme not implemented yet
          />
          <Text style={styles.disabledNote}>Light theme coming soon</Text>
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          
          <Button
            title="Save Settings"
            onPress={saveSettings}
            style={styles.actionButton}
          />

          <Button
            title="Reset to Defaults"
            onPress={resetSettings}
            variant="secondary"
            style={styles.actionButton}
          />

          <Button
            title="Clear All Data"
            onPress={clearAllData}
            variant="danger"
            style={styles.actionButton}
          />
        </View>

        {/* App Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Information</Text>
          
          <View style={styles.infoContainer}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Version</Text>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Build</Text>
              <Text style={styles.infoValue}>2024.1</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Supported Protocols</Text>
              <Text style={styles.infoValue}>OpenSpool, OpenTag3D v0.003</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Printer Support</Text>
              <Text style={styles.infoValue}>Bambu Lab (MQTT)</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_DARK,
  },
  scrollView: {
    flex: 1,
    padding: SPACING.MD,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: FONT_SIZES.LG,
    color: COLORS.TEXT_SECONDARY,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.LG,
  },
  title: {
    fontSize: FONT_SIZES.XXL,
    fontFamily: 'Orbitron-Regular',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS,
  },
  subtitle: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
  },
  section: {
    marginBottom: SPACING.LG,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.MD,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.CARD_BACKGROUND,
    padding: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    marginBottom: SPACING.SM,
  },
  settingTextContainer: {
    flex: 1,
    marginRight: SPACING.MD,
  },
  settingLabel: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 18,
  },
  disabledNote: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT_SECONDARY,
    marginTop: -SPACING.SM,
    marginLeft: SPACING.XS,
    fontStyle: 'italic',
  },
  actionButton: {
    marginBottom: SPACING.SM,
  },
  infoContainer: {
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_DEFAULT,
  },
  infoLabel: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: SPACING.XL,
  },
});

export default SettingsScreen;