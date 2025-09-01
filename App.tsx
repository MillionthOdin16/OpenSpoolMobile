import React, { useState, useRef, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  Modal,
  ActivityIndicator,
  Animated,
  TextInput,
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import NfcManager, { NfcTech, Ndef } from 'react-native-nfc-manager';
import { bambuPrinterService, BambuPrinterService } from './src/services/BambuPrinterService';
import { StorageService } from './src/services/StorageService';
import { tagProtocolService, TagProtocol, ExtendedFilamentData } from './src/services/TagProtocolService';

const OpenSpool = () => {
  const [isLoading, setIsLoading] = useState(true);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const [color, setColor] = useState('magenta');
  const [type, setType] = useState('pla');
  const [minTemp, setMinTemp] = useState('180');
  const [maxTemp, setMaxTemp] = useState('210');
  const [modalTitle, setModalTitle] = useState('Read Tag');
  const [readTagModalOpen, setReadTagModalOpen] = useState(false);

  // Printer functionality state
  const [printerSettingsModalOpen, setPrinterSettingsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState('external');
  const [printerIpAddress, setPrinterIpAddress] = useState('');
  const [printerSerialNumber, setPrinterSerialNumber] = useState('');
  const [printerAccessCode, setPrinterAccessCode] = useState('');
  const [isPrinterConnected, setIsPrinterConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastScannedFilament, setLastScannedFilament] = useState<ExtendedFilamentData | null>(null);

  // Protocol selection state
  const [selectedProtocol, setSelectedProtocol] = useState<TagProtocol>(TagProtocol.OPENSPOOL);

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: 1,
      duration: 720,
      useNativeDriver: true,
    }).start(() => {
      setIsLoading(false);
    });

    // Load saved printer settings
    loadPrinterSettings();
  }, [rotateAnim]);

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

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const colors = [
    { label: 'White', value: 'white', hex: 'FFFFFF' },
    { label: 'Yellow', value: 'yellow', hex: 'FFF144' },
    { label: 'Grass Green', value: 'grass_green', hex: 'DCF478' },
    { label: 'Bambu Green', value: 'bambu_green', hex: '0ACC38' },
    { label: 'Missletoe Green', value: 'missletoe_green', hex: '057748' },
    { label: 'Dark Blue', value: 'dark_blue', hex: '0D6284' },
    { label: 'Glow Green', value: 'glow_green', hex: '0EE2A0' },
    { label: 'Ice Blue', value: 'ice_blue', hex: '76D9F4' },
    { label: 'Cyan', value: 'cyan', hex: '46A8F9' },
    { label: 'Blue', value: 'blue', hex: '2850E0' },
    { label: 'Iris Purple', value: 'iris_purple', hex: '443089' },
    { label: 'Purple', value: 'purple', hex: 'A03CF7' },
    { label: 'Magenta', value: 'magenta', hex: 'F330F9' },
    { label: 'Sakura Pink', value: 'sakura_pink', hex: 'D4B1DD' },
    { label: 'Pink', value: 'pink', hex: 'F95D73' },
    { label: 'Red', value: 'red', hex: 'F72323' },
    { label: 'Dark Brown', value: 'dark_brown', hex: '7C4B00' },
    { label: 'Orange', value: 'orange', hex: 'F98C36' },
    { label: 'Beige', value: 'beige', hex: 'FCECD6' },
    { label: 'Desert Tan', value: 'desert_tan', hex: 'D3C5A3' },
    { label: 'Brown', value: 'brown', hex: 'AF7933' },
    { label: 'Ash Grey', value: 'ash_grey', hex: '898989' },
    { label: 'Grey', value: 'grey', hex: 'BCBCBC' },
    { label: 'Black', value: 'black', hex: '161616' },
  ];

  const types = [
    { label: 'PLA', value: 'pla' },
    { label: 'PETG', value: 'petg' },
    { label: 'ABS', value: 'abs' },
    { label: 'TPU', value: 'tpu' },
    { label: 'Nylon', value: 'nylon' },
  ];

  const temperatures = Array.from({ length: 21 }, (_, i) => ({
    label: `${180 + i * 5}°C`,
    value: (180 + i * 5).toString(),
  }));

  const protocols = tagProtocolService.getAllProtocols().map(protocol => ({
    label: `${protocol.label} v${protocol.version}`,
    value: protocol.value,
  }));

  const slots = BambuPrinterService.getAvailableSlots().map(slot => ({
    label: slot.label,
    value: slot.id,
  }));

  const filamentDefaults: { [key: string]: { minTemp: number; maxTemp: number } } = {
    pla: { minTemp: 190, maxTemp: 240 },
    petg: { minTemp: 220, maxTemp: 270 },
    abs: { minTemp: 240, maxTemp: 280 },
    gpu: { minTemp: 200, maxTemp: 250 },
    tpu: { minTemp: 200, maxTemp: 250 },
    nylon: { minTemp: 190, maxTemp: 240 },
  };

  const renderColorItem = (item: any) => {
    return (
      <View style={styles.colorItem}>
        <View style={[styles.colorSwatch, { backgroundColor: `#${item.hex}` }]} />
        <Text style={styles.colorLabel}>{item.label}</Text>
      </View>
    );
  };

  const verifyAndSetMinTemp = (temp: string) => {
    const tempValue = Number(temp);
    const maxTempValue = Number(maxTemp);

    // Enhanced validation
    if (isNaN(tempValue) || tempValue < 0 || tempValue > 500) {
      Alert.alert('Invalid Temperature', 'Minimum temperature must be between 0°C and 500°C.');
      return;
    }

    // If the new minTemp is equal or greater than the maxTemp, adjust maxTemp
    if (tempValue >= maxTempValue) {
        const tempPlusStep = tempValue + 5;
        const highestTempValue = Number(temperatures[temperatures.length - 1].value);

        // Ensure maxTemp is always greater than minTemp
        const newMaxTemp = Math.min(tempPlusStep, highestTempValue);

        setMaxTemp(String(newMaxTemp));
    }

    // Set the new minTemp
    setMinTemp(temp);
  };

  const verifyAndSetMaxTemp = (temp: string) => {
    const tempValue = Number(temp);
    const minTempValue = Number(minTemp);

    // Enhanced validation
    if (isNaN(tempValue) || tempValue < 0 || tempValue > 500) {
      Alert.alert('Invalid Temperature', 'Maximum temperature must be between 0°C and 500°C.');
      return;
    }

    if (tempValue <= minTempValue) {
      Alert.alert('Temperature Error', 'Maximum temperature must be greater than minimum temperature.');
      return;
    }

    setMaxTemp(temp);
  };

  const setTypeAndDefaults = (newType: string) => {
    setType(newType);
    const defaults = filamentDefaults[newType];
    if (defaults) {
        setMinTemp(String(defaults.minTemp));
        setMaxTemp(String(defaults.maxTemp));
    }
  };

  const checkNfcSupportedAndEnabled = async () => {
    const isNfcSupported = await NfcManager.isSupported();
    if (!isNfcSupported) {
      Alert.alert('NFC is not supported on this device.');
      return false;
    }

    const isNfcEnabled = await NfcManager.isEnabled();
    if (!isNfcEnabled) {
      Alert.alert('NFC is disabled. Please enable it in your device settings.');
      return false;
    }

    return true;
  };

  async function readNdef() {
    try {
      if (Platform.OS === 'android') {
        setModalTitle('Read Tag');
        setReadTagModalOpen(true);
      }

      await NfcManager.requestTechnology(NfcTech.Ndef);
      const tag = await NfcManager.getTag();

      if (tag?.ndefMessage && tag.ndefMessage.length > 0) {
        const rawValue = tag.ndefMessage.map(record =>
          String.fromCharCode(...record.payload)
        ).join('').trim();

        if (!rawValue) {
          Alert.alert('Empty Tag', 'The tag appears to be empty or contains no readable data.');
          return;
        }

        // Try to parse with selected protocol first, then auto-detect
        const parseResult = tagProtocolService.parseTagData(rawValue, selectedProtocol);

        if (parseResult) {
          const { data: parsedData, protocol: detectedProtocol } = parseResult;

          // Enhanced validation of parsed data
          if (!parsedData.color_hex || !parsedData.type || !parsedData.min_temp || !parsedData.max_temp) {
            Alert.alert('Invalid Tag Data', 'The tag contains incomplete filament information.');
            return;
          }

          // Update UI with parsed data
          const matchingColor = colors.find(c => c.hex.toLowerCase() === parsedData.color_hex.toLowerCase());
          const matchingType = types.find(t => t.value.toLowerCase() === parsedData.type.toLowerCase());

          const newColor = matchingColor?.value ?? 'blue';
          const newType = matchingType?.value ?? 'pla';

          setColor(newColor);
          setType(newType);
          setMinTemp(parsedData.min_temp.toString());
          setMaxTemp(parsedData.max_temp.toString());

          // Set protocol if different from selected
          if (detectedProtocol !== selectedProtocol) {
            setSelectedProtocol(detectedProtocol);
            const protocolName = detectedProtocol === TagProtocol.OPENSPOOL ? 'OpenSpool' : 'OpenTag3D';
            Alert.alert(
              'Protocol Auto-Detected',
              `Tag uses ${protocolName} protocol. Protocol selection has been updated.`
            );
          }

          // Store scanned filament data for printer functionality
          setLastScannedFilament(parsedData);

          Alert.alert(
            'Tag Read Successfully',
            `Filament: ${parsedData.brand} ${parsedData.type.toUpperCase()}\nColor: ${parsedData.color_hex}\nTemperature: ${parsedData.min_temp}°C - ${parsedData.max_temp}°C`
          );
        } else {
          Alert.alert(
            'Invalid Tag',
            'Unable to parse tag data. Please ensure the tag contains valid OpenSpool or OpenTag3D filament information.'
          );
        }
      } else {
        Alert.alert('Empty Tag', 'No NDEF message found on the tag.');
      }
    } catch (ex) {
      console.warn('NFC read failed - could be user or system failure', ex);
      Alert.alert(
        'Read Failed',
        'Failed to read the tag. Please ensure NFC is enabled and try holding the tag closer to your device.'
      );
    } finally {
      if (Platform.OS === 'android') {
        setReadTagModalOpen(false);
      }
      NfcManager.cancelTechnologyRequest();
    }
  }

  const writeNdef = async () => {
    const minTempValue = Number(minTemp);
    const maxTempValue = Number(maxTemp);

    // Enhanced validation before writing
    if (isNaN(minTempValue) || isNaN(maxTempValue) || minTempValue >= maxTempValue) {
      Alert.alert('Temperature Error', 'Please ensure minimum temperature is less than maximum temperature.');
      return;
    }

    if (minTempValue < 0 || maxTempValue > 500) {
      Alert.alert('Temperature Range Error', 'Temperatures must be between 0°C and 500°C.');
      return;
    }

    const selectedColor = colors.find(c => c.value === color);
    if (!selectedColor) {
      Alert.alert('Color Error', 'Please select a valid color.');
      return;
    }

    try {
      if (Platform.OS === 'android') {
        setModalTitle('Write To Tag');
        setReadTagModalOpen(true);
      }

      await NfcManager.requestTechnology(NfcTech.Ndef);

      // Create filament data with protocol-specific defaults
      const protocolDefaults = tagProtocolService.getDefaultDataForProtocol(selectedProtocol);
      const filamentData: ExtendedFilamentData = {
        color_hex: selectedColor.hex,
        type: type,
        min_temp: minTempValue,
        max_temp: maxTempValue,
        brand: 'Generic',
        ...protocolDefaults,
      };

      const formattedData = tagProtocolService.formatTagData(filamentData, selectedProtocol);

      if (!formattedData) {
        Alert.alert('Format Error', 'Failed to format tag data for selected protocol. Please check your input values.');
        return;
      }

      const ndefRecords = Ndef.record(Ndef.TNF_MIME_MEDIA, 'application/json', '1', formattedData);
      const bytes = await Ndef.encodeMessage([ndefRecords]);

      if (bytes) {
        await NfcManager.ndefHandler.writeNdefMessage(bytes);
        Alert.alert('Success', `Tag written successfully using ${selectedProtocol === TagProtocol.OPENSPOOL ? 'OpenSpool' : 'OpenTag3D'} protocol.`);
      }
    } catch (error) {
      if(Platform.OS === 'android'){
        Alert.alert('Write Failed', 'Failed to write to tag. If corrupted, try again and keep tag in place for 1 full second.');
      } else {
        Alert.alert('Write Failed', 'Failed to write to tag. Please try again.');
      }
      console.error('Error writing JSON:', error);
    } finally {
      if (Platform.OS === 'android') {
        setReadTagModalOpen(false);
      }
      NfcManager.cancelTechnologyRequest();
    }
  };

  const closeModalAndCancelRead = () => {
    setReadTagModalOpen(false);
    NfcManager.cancelTechnologyRequest();
  };

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
    try {
      console.log('Attempting to connect to printer:', printerIpAddress);
      const connected = await bambuPrinterService.connect();
      setIsPrinterConnected(connected);
      if (connected) {
        Alert.alert('Success', 'Connected to printer successfully.');
      } else {
        Alert.alert(
          'Connection Failed',
          'Failed to establish connection with the printer. Please verify your network settings and try again.',
        );
      }
    } catch (error) {
      setIsPrinterConnected(false);
      console.error('Printer connection error:', error);
      Alert.alert(
        'Connection Error',
        'Failed to connect to printer. Please check:\n• IP address is correct\n• Printer is on the same network\n• Access code is valid (if required)\n• Printer is powered on',
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const sendFilamentToPrinter = async () => {
    if (!lastScannedFilament) {
      Alert.alert('No Filament Data', 'Please scan a filament tag first.');
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

      console.log('Sending filament to printer:', {
        slot: selectedSlotInfo.label,
        filament: {
          type: lastScannedFilament.type,
          brand: lastScannedFilament.brand,
          color: lastScannedFilament.color_hex,
          temps: `${lastScannedFilament.min_temp}-${lastScannedFilament.max_temp}°C`,
        },
      });

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.card} overScrollMode="always">
        <Text style={styles.title}>OpenSpool</Text>

        <View style={styles.circleContainer}>
          <View style={styles.circleWrapper}>
            <View
                style={[
                  styles.circle,
                  isLoading
                    ? styles.loadingCircle
                    : { backgroundColor: `#${colors.find(c => c.value === color)?.hex}` || color },
                ]}
              />
              <Animated.Image
                source={require('./assets/openspool-transparent.png')}
                style={[
                  styles.overlayImage,
                  {
                    transform: [{ rotate: isLoading ? spin : '0deg' }],
                  },
                ]}
                resizeMode="cover"
              />
          </View>
        </View>

        <View style={styles.fieldsContainer}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Color</Text>
            <Dropdown
              style={styles.dropdown}
              containerStyle={[styles.dropdownContainer, styles.dropdownMaxHeight]}
              data={colors}
              labelField="label"
              valueField="value"
              placeholder="Select color"
              value={color}
              onChange={item => setColor(item.value)}
              renderItem={renderColorItem}
              placeholderStyle={styles.placeHolder}
              selectedTextStyle={[styles.selected, styles.whiteText]}
              flatListProps={{
                nestedScrollEnabled: true,
                scrollEnabled: true,
              }}
              itemContainerStyle={styles.dropdownItemBackground}
              activeColor="#3d3d3d" // Slightly lighter for selection highlight
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Type</Text>
            <Dropdown
              style={styles.dropdown}
              containerStyle={styles.dropdownContainer}
              data={types}
              labelField="label"
              valueField="value"
              placeholder="Select type"
              value={type}
              onChange={item => setTypeAndDefaults(item.value)}
              placeholderStyle={styles.placeHolder}
              selectedTextStyle={styles.selected}
              renderItem={(item) => (
                <Text style={[styles.colorLabel, styles.dropdownItemPadding]}>{item.label}</Text>
              )}
              activeColor="#3d3d3d" // Add highlight color
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Protocol</Text>
            <Dropdown
              style={styles.dropdown}
              containerStyle={styles.dropdownContainer}
              data={protocols}
              labelField="label"
              valueField="value"
              placeholder="Select protocol"
              value={selectedProtocol}
              onChange={item => setSelectedProtocol(item.value)}
              placeholderStyle={styles.placeHolder}
              selectedTextStyle={styles.selected}
              renderItem={(item) => (
                <Text style={[styles.colorLabel, styles.dropdownItemPadding]}>{item.label}</Text>
              )}
              activeColor="#3d3d3d"
            />
          </View>

          <View style={styles.temperatureContainer}>
            <View style={[styles.fieldGroup, styles.temperatureField]}>
              <Text style={styles.label}>Min Temp</Text>
              <Dropdown
                style={styles.dropdown}
                containerStyle={styles.dropdownContainer}
                data={temperatures.slice(0, -1)}
                labelField="label"
                valueField="value"
                placeholder="Min temp"
                value={minTemp}
                onChange={item => verifyAndSetMinTemp(item.value)}
                placeholderStyle={styles.placeHolder}
                selectedTextStyle={[styles.selected, styles.whiteText]}
                renderItem={(item) => (
                  <Text style={[styles.colorLabel, styles.dropdownItemPadding]}>{item.label}</Text>
                )}
                activeColor="#3d3d3d" // Add highlight color
              />
            </View>

            <View style={[styles.fieldGroup, styles.temperatureField]}>
              <Text style={styles.label}>Max Temp</Text>
              <Dropdown
                style={styles.dropdown}
                containerStyle={styles.dropdownContainer}
                data={temperatures.filter(temp => parseInt(temp.value, 10) > parseInt(minTemp, 10))}
                labelField="label"
                valueField="value"
                placeholder="Max temp"
                value={maxTemp}
                onChange={item => verifyAndSetMaxTemp(item.value)}
                placeholderStyle={styles.placeHolder}
                selectedTextStyle={[styles.selected, styles.whiteText]}
                renderItem={(item) => (
                  <Text style={[styles.colorLabel, styles.dropdownItemPadding]}>{item.label}</Text>
                )}
                activeColor="#3d3d3d" // Add highlight color
              />
            </View>
          </View>
        </View>

        <View style={styles.printerSection}>
          <Text style={styles.sectionTitle}>Printer Integration</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Target Slot</Text>
            <Dropdown
              style={styles.dropdown}
              containerStyle={styles.dropdownContainer}
              data={slots}
              labelField="label"
              valueField="value"
              placeholder="Select slot"
              value={selectedSlot}
              onChange={item => setSelectedSlot(item.value)}
              placeholderStyle={styles.placeHolder}
              selectedTextStyle={styles.selected}
              renderItem={(item) => (
                <Text style={[styles.colorLabel, styles.dropdownItemPadding]}>{item.label}</Text>
              )}
              activeColor="#3d3d3d"
            />
          </View>

          <View style={styles.printerButtonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.printerButton]}
              onPress={() => setPrinterSettingsModalOpen(true)}
            >
              <Text style={styles.buttonText}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.printerButton, isPrinterConnected && styles.connectedButton]}
              onPress={connectToPrinter}
              disabled={isConnecting}
            >
              <Text style={styles.buttonText}>
                {isConnecting ? 'Connecting...' : (isPrinterConnected ? 'Connected' : 'Connect')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.printerButton,
                (!lastScannedFilament || !isPrinterConnected) && styles.disabledButton,
              ]}
              onPress={sendFilamentToPrinter}
              disabled={!lastScannedFilament || !isPrinterConnected}
            >
              <Text style={styles.buttonText}>Send to Printer</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={async () => {
              const isNfcReady = await checkNfcSupportedAndEnabled();
              if (isNfcReady) {
                readNdef();
              }
            }}
          >
            <Text style={styles.buttonText}>Read Tag</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={async () => {
              const isNfcReady = await checkNfcSupportedAndEnabled();
              if (isNfcReady) {
                writeNdef();
              }
            }}
          >
            <Text style={styles.buttonText}>Write Tag</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {Platform.OS === 'android' && (
        <Modal
          visible={readTagModalOpen}
          transparent={false}
          animationType={'slide'}
          onRequestClose={closeModalAndCancelRead}
          presentationStyle={'overFullScreen'}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {modalTitle}
                </Text>
                <TouchableOpacity onPress={closeModalAndCancelRead}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.androidModalContainer}>
                <Text style={styles.androidModalText}>Waiting for tag...</Text>
                <Text style={[styles.androidDurationText, styles.waitingText]}>
                  Hold Tag To Phone For 1 Second
                </Text>
                <ActivityIndicator size={'large'} color={'#ea338d'} />
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Printer Settings Modal */}
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

            <View style={styles.modalBody}>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>IP Address</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="192.168.1.100"
                  placeholderTextColor="#999"
                  value={printerIpAddress}
                  onChangeText={setPrinterIpAddress}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Serial Number</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="01S00A123456789"
                  placeholderTextColor="#999"
                  value={printerSerialNumber}
                  onChangeText={setPrinterSerialNumber}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Access Code (optional)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="12345678"
                  placeholderTextColor="#999"
                  value={printerAccessCode}
                  onChangeText={setPrinterAccessCode}
                  secureTextEntry={true}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.modalFooter} onPress={savePrinterSettings}>
              <Text style={styles.modalFooterText}>Save Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashLogo: {
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  card: {
    flex: 1,
    backgroundColor: '#2d2d2d',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
    }),
  },
  title: {
    fontSize: 24,
    fontFamily: 'Orbitron-Regular',
    textAlign: 'center',
    marginBottom: 20,
    color: '#ffffff',
  },
  circleContainer: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  circleWrapper: {
    position: 'relative',
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayImage: {
    position: 'absolute',
    width: 180,
    height: 180,
    opacity: 1.0,
  },
  navigationButton: {
    padding: 12,
  },
  navigationIcon: {
    fontSize: 24,
    color: '#999',
  },
  circle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignContent: 'center',
    backgroundColor: 'black',
    overflow: 'hidden',
    ...Platform.select({
      android: {
        elevation: 0,
      },
      ios: {
        shadowRadius: 0,
      },
    }),
  },
  fieldsContainer: {
    gap: 9,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  dropdown: {
    height: 40,
    borderColor: '#404040',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    backgroundColor: '#363636',
  },
  dropdownContainer: {
    borderRadius: 8,
    backgroundColor: '#363636',
  },
  temperatureContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  temperatureField: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 16,
  },
  button: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#404040',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#363636',
  },
  buttonText: {
    fontSize: 16,
    color: '#ffffff',
  },
  colorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  colorLabel: {
    fontSize: 16,
    color: '#ffffff', // White text for better contrast
    fontWeight: '600', // Added weight for better readability
  },
  colorSwatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)', // Light border for contrast
  },
  placeHolder: {
    color: '#999',
  },
  selected: {
    color: '#ffffff',
  },
  androidModalContainer: {
    alignContent: 'center',
  },
  androidModalText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  androidDurationText: {
    fontSize: 12,
  },
  waitingText: {
    marginVertical: 15,
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#2d2d2d',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    fontSize: 20,
    color: '#fff',
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#555',
  },
  modalBody: {
    marginBottom: 20,
  },
  modalItem: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  modalFooter: {
    alignSelf: 'flex-end',
    marginTop: 10,
    backgroundColor: '#007BFF',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  modalFooterText: {
    color: '#fff',
    fontSize: 16,
  },
  cancelButton: {
    flex: 1,
    justifyContent: 'flex-end',
    color: '#333',
  },
  printerSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#404040',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  printerButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 8,
  },
  printerButton: {
    flex: 1,
  },
  connectedButton: {
    backgroundColor: '#0ACC38',
    borderColor: '#0ACC38',
  },
  disabledButton: {
    backgroundColor: '#555',
    borderColor: '#555',
    opacity: 0.6,
  },
  textInput: {
    height: 40,
    borderColor: '#404040',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#363636',
    color: '#ffffff',
    fontSize: 16,
  },
  loadingCircle: {
    backgroundColor: '#ff0081',
  },
  dropdownMaxHeight: {
    maxHeight: 300,
    backgroundColor: '#2d2d2d',
  },
  whiteText: {
    color: '#ffffff',
  },
  dropdownItemBackground: {
    backgroundColor: '#2d2d2d',
  },
  dropdownItemPadding: {
    padding: 10,
  },
});

export default OpenSpool;
