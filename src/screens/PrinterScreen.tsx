import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  Alert,
  Modal,
  TouchableOpacity,
} from 'react-native';

import Button from '../components/Button';
import InputField from '../components/InputField';
import CustomDropdown, { DropdownOption } from '../components/CustomDropdown';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import { bambuPrinterService, BambuPrinterService } from '../services/BambuPrinterService';
import { StorageService } from '../services/StorageService';
import { ExtendedFilamentData } from '../services/TagProtocolService';
import { appStateManager } from '../utils/AppStateManager';

const PrinterScreen: React.FC = () => {
  // Connection state
  const [isPrinterConnected, setIsPrinterConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('Disconnected');

  // Settings
  const [printerSettingsModalOpen, setPrinterSettingsModalOpen] = useState(false);
  const [printerIpAddress, setPrinterIpAddress] = useState('');
  const [printerSerialNumber, setPrinterSerialNumber] = useState('');
  const [printerAccessCode, setPrinterAccessCode] = useState('');

  // Filament management
  const [selectedSlot, setSelectedSlot] = useState('external');
  const [lastScannedFilament, setLastScannedFilament] = useState<ExtendedFilamentData | null>(null);

  // Printer status
  const [printerStatus, setPrinterStatus] = useState<any>(null);

  useEffect(() => {
    loadPrinterSettings();

    // Load last scanned filament from shared state
    const lastFilament = appStateManager.getLastScannedFilament();
    if (lastFilament) {
      setLastScannedFilament(lastFilament);
    }

    // Listen for filament updates from other screens
    const handleFilamentUpdate = (filament: ExtendedFilamentData | null) => {
      setLastScannedFilament(filament);
    };
    appStateManager.addListener(handleFilamentUpdate);

    // Set up status callbacks
    bambuPrinterService.onStatusUpdate = (status) => {
      setPrinterStatus(status);
      if (status.gcode_state) {
        setConnectionStatus(`Connected - ${status.gcode_state}`);
      }
    };

    return () => {
      appStateManager.removeListener(handleFilamentUpdate);
      bambuPrinterService.onStatusUpdate = null;
    };
  }, []);

  const loadPrinterSettings = async () => {
    try {
      const settings = await StorageService.loadPrinterSettings();
      if (settings) {
        setPrinterIpAddress(settings.ipAddress);
        setPrinterSerialNumber(settings.serialNumber);
        setPrinterAccessCode(settings.accessCode || '');
        bambuPrinterService.configure(settings);
      }
    } catch (error) {
      console.error('Failed to load printer settings:', error);
    }
  };


  const slotOptions: DropdownOption[] = BambuPrinterService.getAvailableSlots().map(slot => ({
    label: slot.label,
    value: slot.id,
  }));

  const savePrinterSettings = async () => {
    if (!printerIpAddress.trim() || !printerSerialNumber.trim()) {
      Alert.alert('Error', 'Please enter both IP address and serial number.');
      return;
    }

    try {
      const settings = {
        ipAddress: printerIpAddress.trim(),
        serialNumber: printerSerialNumber.trim(),
        accessCode: printerAccessCode.trim(),
      };

      await StorageService.savePrinterSettings(settings);
      bambuPrinterService.configure(settings);
      setPrinterSettingsModalOpen(false);
      Alert.alert('Success', 'Printer settings saved successfully.');
    } catch (error) {
      Alert.alert('Error', 'Failed to save printer settings.');
    }
  };

  const connectToPrinter = async () => {
    if (!printerIpAddress.trim() || !printerSerialNumber.trim()) {
      Alert.alert('Configuration Required', 'Please configure printer settings first.');
      setPrinterSettingsModalOpen(true);
      return;
    }

    setIsConnecting(true);
    setConnectionStatus('Connecting...');

    try {
      console.log('Attempting to connect to printer:', printerIpAddress);
      const connected = await bambuPrinterService.connect();
      setIsPrinterConnected(connected);

      if (connected) {
        setConnectionStatus('Connected');
        Alert.alert('Success', 'Connected to printer successfully.');
      } else {
        setConnectionStatus('Connection Failed');
        Alert.alert(
          'Connection Failed',
          'Failed to establish connection with the printer. Please verify your network settings and try again.',
        );
      }
    } catch (error) {
      setIsPrinterConnected(false);
      setConnectionStatus('Connection Error');
      console.error('Printer connection error:', error);
      Alert.alert(
        'Connection Error',
        'Failed to connect to printer. Please check:\n• IP address is correct\n• Printer is on the same network\n• Access code is valid (if required)\n• Printer is powered on',
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectFromPrinter = async () => {
    try {
      await bambuPrinterService.disconnect();
      setIsPrinterConnected(false);
      setConnectionStatus('Disconnected');
      setPrinterStatus(null);
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  const sendFilamentToPrinter = async () => {
    if (!lastScannedFilament) {
      Alert.alert('No Filament Data', 'Please scan a filament tag first from the NFC Tags screen.');
      return;
    }

    if (!isPrinterConnected) {
      Alert.alert('Printer Not Connected', 'Please connect to printer first.');
      return;
    }

    try {
      const selectedSlotInfo = BambuPrinterService.getAvailableSlots().find(s => s.id === selectedSlot);
      if (!selectedSlotInfo) {
        Alert.alert('Invalid Slot', 'Invalid slot selection. Please select a valid printer slot.');
        return;
      }

      await bambuPrinterService.sendFilamentToSlot(lastScannedFilament, selectedSlotInfo);
      Alert.alert(
        'Success',
        `Filament settings sent to ${selectedSlotInfo.label} successfully.\n\nFilament: ${lastScannedFilament.brand} ${lastScannedFilament.type.toUpperCase()}\nColor: #${lastScannedFilament.color_hex}\nTemperature: ${lastScannedFilament.min_temp}°C - ${lastScannedFilament.max_temp}°C`,
      );
    } catch (error) {
      console.error('Send filament error:', error);
      Alert.alert(
        'Send Failed',
        'Failed to send filament settings to printer. Please ensure:\n• Printer is still connected\n• Selected slot is available\n• Network connection is stable',
      );
    }
  };

  const getConnectionStatusColor = () => {
    if (isConnecting) {return COLORS.WARNING;}
    if (isPrinterConnected) {return COLORS.SUCCESS;}
    return COLORS.ERROR;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Printer Control</Text>
          <Text style={styles.subtitle}>Manage your Bambu Lab printer</Text>
        </View>

        {/* Connection Status */}
        <View style={styles.statusContainer}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>Connection Status</Text>
            <View style={[styles.statusIndicator, { backgroundColor: getConnectionStatusColor() }]} />
          </View>
          <Text style={[styles.statusText, { color: getConnectionStatusColor() }]}>
            {connectionStatus}
          </Text>
          {printerStatus && (
            <View style={styles.printerInfo}>
              <Text style={styles.printerInfoTitle}>Printer Information:</Text>
              <Text style={styles.printerInfoText}>
                Model: {printerStatus.wifi_signal || 'Unknown'}
              </Text>
              {printerStatus.nozzle_temper && (
                <Text style={styles.printerInfoText}>
                  Nozzle: {printerStatus.nozzle_temper}°C | Bed: {printerStatus.bed_temper}°C
                </Text>
              )}
              {printerStatus.mc_percent !== undefined && (
                <Text style={styles.printerInfoText}>
                  Print Progress: {printerStatus.mc_percent}%
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsContainer}>
            <Button
              title="Settings"
              onPress={() => setPrinterSettingsModalOpen(true)}
              variant="secondary"
              style={styles.quickActionButton}
            />
            <Button
              title={isPrinterConnected ? 'Disconnect' : 'Connect'}
              onPress={isPrinterConnected ? disconnectFromPrinter : connectToPrinter}
              variant={isPrinterConnected ? 'danger' : 'success'}
              disabled={isConnecting}
              style={styles.quickActionButton}
            />
          </View>
        </View>

        {/* Filament Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Filament Management</Text>

          <CustomDropdown
            label="Target Slot"
            data={slotOptions}
            value={selectedSlot}
            onChange={(item) => setSelectedSlot(item.value)}
            placeholder="Select slot"
          />

          {lastScannedFilament ? (
            <View style={styles.filamentInfoContainer}>
              <Text style={styles.filamentInfoTitle}>Ready to Send:</Text>
              <Text style={styles.filamentInfoText}>
                {lastScannedFilament.brand} {lastScannedFilament.type.toUpperCase()}
              </Text>
              <Text style={styles.filamentInfoDetails}>
                Color: #{lastScannedFilament.color_hex} | {lastScannedFilament.min_temp}°C - {lastScannedFilament.max_temp}°C
              </Text>
            </View>
          ) : (
            <View style={styles.noFilamentContainer}>
              <Text style={styles.noFilamentText}>No filament data available</Text>
              <Text style={styles.noFilamentSubtext}>
                Scan a filament tag in the NFC Tags screen to enable filament management
              </Text>
            </View>
          )}

          <Button
            title="Send to Printer"
            onPress={sendFilamentToPrinter}
            disabled={!lastScannedFilament || !isPrinterConnected}
            style={styles.sendButton}
          />
        </View>

        {/* Advanced Controls */}
        {isPrinterConnected && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Advanced Controls</Text>
            <Text style={styles.comingSoonText}>
              Additional printer controls coming soon...
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Settings Modal */}
      <Modal
        visible={printerSettingsModalOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPrinterSettingsModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Printer Settings</Text>
              <TouchableOpacity onPress={() => setPrinterSettingsModalOpen(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <InputField
                label="IP Address"
                value={printerIpAddress}
                onChangeText={setPrinterIpAddress}
                placeholder="192.168.1.100"
                keyboardType="numeric"
              />

              <InputField
                label="Serial Number"
                value={printerSerialNumber}
                onChangeText={setPrinterSerialNumber}
                placeholder="01S00A123456789"
              />

              <InputField
                label="Access Code (optional)"
                value={printerAccessCode}
                onChangeText={setPrinterAccessCode}
                placeholder="12345678"
                secureTextEntry={true}
              />
            </ScrollView>

            <Button
              title="Save Settings"
              onPress={savePrinterSettings}
              style={styles.saveButton}
            />
          </View>
        </View>
      </Modal>
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
  statusContainer: {
    backgroundColor: COLORS.CARD_BACKGROUND,
    padding: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    marginBottom: SPACING.LG,
    borderWidth: 1,
    borderColor: COLORS.BORDER_DEFAULT,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.XS,
  },
  statusTitle: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '600',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    marginBottom: SPACING.SM,
  },
  printerInfo: {
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER_DEFAULT,
    paddingTop: SPACING.SM,
  },
  printerInfoTitle: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.XS,
  },
  printerInfoText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 2,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    gap: SPACING.MD,
  },
  quickActionButton: {
    flex: 1,
  },
  filamentInfoContainer: {
    backgroundColor: COLORS.CARD_BACKGROUND,
    padding: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    marginBottom: SPACING.MD,
    borderWidth: 1,
    borderColor: COLORS.SUCCESS,
  },
  filamentInfoTitle: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '600',
    marginBottom: SPACING.XS,
  },
  filamentInfoText: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.SUCCESS,
    fontWeight: '600',
  },
  filamentInfoDetails: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginTop: SPACING.XS,
  },
  noFilamentContainer: {
    backgroundColor: COLORS.CARD_BACKGROUND,
    padding: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    marginBottom: SPACING.MD,
    borderWidth: 1,
    borderColor: COLORS.BORDER_DEFAULT,
    alignItems: 'center',
  },
  noFilamentText: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '600',
    marginBottom: SPACING.XS,
  },
  noFilamentSubtext: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  sendButton: {
    marginTop: SPACING.SM,
  },
  comingSoonText: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: SPACING.LG,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.OVERLAY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.LG,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  modalTitle: {
    fontSize: FONT_SIZES.XL,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  closeButton: {
    fontSize: FONT_SIZES.XL,
    color: COLORS.TEXT_PRIMARY,
  },
  modalBody: {
    maxHeight: 300,
  },
  saveButton: {
    marginTop: SPACING.MD,
  },
});

export default PrinterScreen;
